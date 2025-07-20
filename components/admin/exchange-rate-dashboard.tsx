"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Save, TrendingUp, History, AlertCircle } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface ExchangeRate {
  standardRate: number
  premiumRate: number
  lastUpdated: string
}

interface ExchangeRateHistory {
  id: number
  standardRate: number
  premiumRate: number
  createdAt: string
  createdBy: string
}

export function ExchangeRateDashboard() {
  const [currentRates, setCurrentRates] = useState<ExchangeRate | null>(null)
  const [rateHistory, setRateHistory] = useState<ExchangeRateHistory[]>([])
  const [newStandardRate, setNewStandardRate] = useState("")
  const [newPremiumRate, setNewPremiumRate] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [activeTab, setActiveTab] = useState("current")
  const { toast } = useToast()
  const { token, isAuthenticated } = useAuth()

  // Cargar tasas actuales y historial
  useEffect(() => {
    if (isAuthenticated) {
      fetchCurrentRates()
      fetchRateHistory()
    }
  }, [isAuthenticated])

  const fetchCurrentRates = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/exchange-rate", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      setCurrentRates(data)

      // Inicializar los campos del formulario con los valores actuales
      setNewStandardRate(data.standardRate.toString())
      setNewPremiumRate(data.premiumRate.toString())
    } catch (error) {
      console.error("Error al obtener tasas actuales:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las tasas actuales",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRateHistory = async () => {
    try {
      const response = await fetch("/api/exchange-rate/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      setRateHistory(data)
    } catch (error) {
      console.error("Error al obtener historial de tasas:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el historial de tasas",
        variant: "destructive",
      })
    }
  }

  const handleUpdateRates = async () => {
    // Validar los datos de entrada
    if (!newStandardRate || !newPremiumRate) {
      toast({
        title: "Error",
        description: "Por favor, ingresa ambas tasas",
        variant: "destructive",
      })
      return
    }

    // Validar que sean números válidos
    const standardRateNum = Number(newStandardRate)
    const premiumRateNum = Number(newPremiumRate)

    if (isNaN(standardRateNum) || isNaN(premiumRateNum) || standardRateNum <= 0 || premiumRateNum <= 0) {
      toast({
        title: "Error",
        description: "Las tasas deben ser números positivos",
        variant: "destructive",
      })
      return
    }

    // Validar que la tasa premium sea mayor que la estándar
    if (premiumRateNum <= standardRateNum) {
      toast({
        title: "Error",
        description: "La tasa premium debe ser mayor que la tasa estándar",
        variant: "destructive",
      })
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch("/api/exchange-rate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          standardRate: standardRateNum,
          premiumRate: premiumRateNum,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Tasas actualizadas",
          description: "Las tasas de cambio se han actualizado correctamente",
        })

        // Actualizar datos
        fetchCurrentRates()
        fetchRateHistory()
      } else {
        throw new Error(data.message || "No se pudo actualizar las tasas")
      }
    } catch (error) {
      console.error("Error al actualizar tasas:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar las tasas",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Acceso Restringido</CardTitle>
          <CardDescription>Debes iniciar sesión como administrador para acceder a esta sección.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6">
            <AlertCircle className="h-10 w-10 text-amber-500 mr-2" />
            <p>Por favor, inicia sesión para continuar.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Administración de Tasas de Cambio
        </CardTitle>
        <CardDescription>Gestiona las tasas de cambio EUR/VES y visualiza el historial de cambios.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="current">Tasas Actuales</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="current">
            <div className="space-y-6">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
                </div>
              ) : currentRates ? (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Tasa Estándar</CardTitle>
                        <CardDescription>Para usuarios no registrados</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-amber-600">1 EUR = {currentRates.standardRate} VES</div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Tasa Premium</CardTitle>
                        <CardDescription>Para usuarios registrados</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-green-600">1 EUR = {currentRates.premiumRate} VES</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="text-sm text-gray-500 text-center">
                    Última actualización: {formatDate(new Date(currentRates.lastUpdated))}
                  </div>

                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-lg font-medium mb-4">Actualizar Tasas</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="standardRate">Tasa Estándar (EUR/VES)</Label>
                        <Input
                          id="standardRate"
                          type="number"
                          value={newStandardRate}
                          onChange={(e) => setNewStandardRate(e.target.value)}
                          placeholder="Ej: 72.5"
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="premiumRate">Tasa Premium (EUR/VES)</Label>
                        <Input
                          id="premiumRate"
                          type="number"
                          value={newPremiumRate}
                          onChange={(e) => setNewPremiumRate(e.target.value)}
                          placeholder="Ej: 73.5"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleUpdateRates}
                      className="w-full mt-4 bg-amber-500 hover:bg-amber-600"
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Actualizando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Guardar Cambios
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">No se pudieron cargar las tasas actuales.</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Historial de Cambios</h3>
                <Button variant="outline" size="sm" onClick={fetchRateHistory} className="flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
              </div>

              {rateHistory.length > 0 ? (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Tasa Estándar</TableHead>
                        <TableHead>Tasa Premium</TableHead>
                        <TableHead>Diferencia</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rateHistory.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{formatDate(new Date(item.createdAt))}</TableCell>
                          <TableCell>{item.standardRate}</TableCell>
                          <TableCell>{item.premiumRate}</TableCell>
                          <TableCell>{(item.premiumRate - item.standardRate).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 border rounded-md">
                  No hay historial de cambios disponible.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="border-t pt-4 text-sm text-gray-500">
        <div className="flex items-center">
          <History className="h-4 w-4 mr-2" />
          Los cambios en las tasas se registran automáticamente en el historial.
        </div>
      </CardFooter>
    </Card>
  )
}
