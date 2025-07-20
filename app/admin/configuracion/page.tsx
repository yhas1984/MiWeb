"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { Lock, CheckCircle, XCircle, RefreshCw } from "lucide-react"

// Reemplazar la interfaz ConfigStatus para eliminar la sección de Twitter
interface ConfigStatus {
  jwt: {
    secretConfigured: boolean
    secretLength: number
  }
  mockNews: boolean
}

export default function ConfigPage() {
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const { isAuthenticated, token, login, isLoading: authLoading } = useAuth()
  const [password, setPassword] = useState("")

  useEffect(() => {
    if (isAuthenticated) {
      fetchConfigStatus()
    }
  }, [isAuthenticated])

  // Modificar la función fetchConfigStatus para no verificar Twitter
  const fetchConfigStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/verify-tokens", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      setConfigStatus(data.config)
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo verificar la configuración",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              Acceso Restringido
            </CardTitle>
            <CardDescription>
              Ingresa la contraseña de administrador para acceder a la configuración del sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa la contraseña"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <Button
                onClick={() => login(password)}
                className="w-full bg-amber-500 hover:bg-amber-600"
                disabled={authLoading}
              >
                {authLoading ? "Verificando..." : "Acceder"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Configuración del Sistema</h1>

      <div className="flex justify-end mb-4">
        <Button onClick={fetchConfigStatus} disabled={isLoading} variant="outline" className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Verificando configuración...</div>
      ) : configStatus ? (
        <div className="grid md:grid-cols-2 gap-6">
          {/* La sección de Twitter ha sido eliminada */}

          <Card>
            <CardHeader>
              <CardTitle>JWT Secret</CardTitle>
              <CardDescription>Configuración del secreto para autenticación JWT</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Estado:</span>
                  {configStatus.jwt.secretConfigured ? (
                    <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" /> Configurado
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
                      <XCircle className="h-4 w-4" /> No configurado
                    </Badge>
                  )}
                </div>
                {configStatus.jwt.secretConfigured && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Longitud del secreto:</span>
                    <span>{configStatus.jwt.secretLength} caracteres</span>
                  </div>
                )}
                <div className="pt-2">
                  <p className="text-sm text-gray-600">
                    {configStatus.jwt.secretConfigured
                      ? "El secreto JWT está configurado correctamente. La autenticación debería funcionar."
                      : "El secreto JWT no está configurado. Se está usando un valor predeterminado, lo que puede ser inseguro."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Modo de Noticias</CardTitle>
              <CardDescription>Configuración del modo de noticias (reales o simuladas)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Modo:</span>
                  {configStatus.mockNews ? (
                    <Badge className="bg-amber-100 text-amber-800 flex items-center gap-1">Noticias Simuladas</Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" /> Noticias Reales
                    </Badge>
                  )}
                </div>
                <div className="pt-2">
                  <p className="text-sm text-gray-600">
                    {configStatus.mockNews
                      ? "El sistema está configurado para usar noticias simuladas. Cambia la variable de entorno USE_MOCK_NEWS a 'false' para usar noticias reales."
                      : "El sistema está configurado para usar noticias reales."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-8 text-red-600">
          No se pudo obtener la información de configuración. Intenta nuevamente.
        </div>
      )}
    </div>
  )
}
