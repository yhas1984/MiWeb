"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Euro, RefreshCw, Calculator } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { ClientOnly } from "@/lib/client-only"

interface CurrencyConverterProps {
  initialStandardRate?: number
  initialPremiumRate?: number
}

// Clave para almacenar las tasas en localStorage
const RATES_STORAGE_KEY = "tuenvioexpress_rates"

export function CurrencyConverter({ initialStandardRate = 72, initialPremiumRate = 73 }: CurrencyConverterProps) {
  const [standardRate, setStandardRate] = useState(initialStandardRate)
  const [premiumRate, setPremiumRate] = useState(initialPremiumRate)
  const [euroAmount, setEuroAmount] = useState("")
  const [bolivarAmount, setBolivarAmount] = useState("")
  const [activeTab, setActiveTab] = useState<string>("standard")
  const [isLoading, setIsLoading] = useState(false)
  const [lastEdited, setLastEdited] = useState<"euro" | "bolivar" | null>(null)
  const { toast } = useToast()
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Añadimos un efecto para controlar el montaje del componente
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    // Solo ejecutar este efecto en el cliente
    if (!isMounted) return

    // Primero cargamos desde localStorage para mostrar algo inmediatamente
    const success = loadRatesFromStorage()

    // Luego intentamos obtener las tasas más recientes del servidor
    // Solo si no pudimos cargar desde localStorage o si es la carga inicial
    if (!success || !initialLoadDone) {
      fetchCurrentRate()
      setInitialLoadDone(true)
    }

    // Escuchar eventos de actualización de tasas desde el componente ExchangeRate
    const handleRatesUpdated = (event: CustomEvent) => {
      console.log("Evento ratesUpdated recibido en CurrencyConverter:", event.detail)
      if (event.detail) {
        const newStandardRate = Number(event.detail.standardRate)
        const newPremiumRate = Number(event.detail.premiumRate)

        if (!isNaN(newStandardRate) && newStandardRate > 0) {
          setStandardRate(newStandardRate)
        }

        if (!isNaN(newPremiumRate) && newPremiumRate > 0) {
          setPremiumRate(newPremiumRate)
        }

        // Recalcular conversión si hay valores
        if (lastEdited === "euro" && euroAmount) {
          const rate = activeTab === "standard" ? newStandardRate : newPremiumRate
          const euroValue = Number.parseFloat(euroAmount)
          if (!isNaN(euroValue)) {
            const bolivarValue = euroValue * rate
            setBolivarAmount(bolivarValue.toFixed(2))
          }
        } else if (lastEdited === "bolivar" && bolivarAmount) {
          const rate = activeTab === "standard" ? newStandardRate : newPremiumRate
          const bolivarValue = Number.parseFloat(bolivarAmount)
          if (!isNaN(bolivarValue)) {
            const euroValue = bolivarValue / rate
            setEuroAmount(euroValue.toFixed(2))
          }
        }
      }
    }

    window.addEventListener("ratesUpdated", handleRatesUpdated as EventListener)

    return () => {
      window.removeEventListener("ratesUpdated", handleRatesUpdated as EventListener)
    }
  }, [euroAmount, bolivarAmount, lastEdited, activeTab, isMounted, initialLoadDone])

  // Recalcular cuando cambia la tasa
  useEffect(() => {
    if (!isMounted) return

    if (lastEdited === "euro" && euroAmount) {
      convertEuroToBolivar(euroAmount)
    } else if (lastEdited === "bolivar" && bolivarAmount) {
      convertBolivarToEuro(bolivarAmount)
    }
  }, [activeTab, standardRate, premiumRate, isMounted, lastEdited, euroAmount, bolivarAmount])

  // Cargar tasas desde localStorage
  const loadRatesFromStorage = () => {
    if (typeof window === "undefined") return false

    try {
      const savedRates = localStorage.getItem(RATES_STORAGE_KEY)
      if (savedRates) {
        const rates = JSON.parse(savedRates)
        console.log("CurrencyConverter: Cargando tasas desde localStorage:", rates)

        // Asegurar que los valores son números
        const standardRateValue = Number(rates.standardRate)
        const premiumRateValue = Number(rates.premiumRate)

        if (!isNaN(standardRateValue) && standardRateValue > 0) {
          setStandardRate(standardRateValue)
        } else {
          console.error("Error: standardRate inválido en localStorage", rates.standardRate)
          return false
        }

        if (!isNaN(premiumRateValue) && premiumRateValue > 0) {
          setPremiumRate(premiumRateValue)
        } else {
          console.error("Error: premiumRate inválido en localStorage", rates.premiumRate)
          return false
        }

        // Recalcular conversión si hay valores
        if (lastEdited === "euro" && euroAmount) {
          const rate = activeTab === "standard" ? standardRateValue : premiumRateValue
          const euroValue = Number.parseFloat(euroAmount)
          if (!isNaN(euroValue)) {
            const bolivarValue = euroValue * rate
            setBolivarAmount(bolivarValue.toFixed(2))
          }
        } else if (lastEdited === "bolivar" && bolivarAmount) {
          const rate = activeTab === "standard" ? standardRateValue : premiumRateValue
          const bolivarValue = Number.parseFloat(bolivarAmount)
          if (!isNaN(bolivarValue)) {
            const euroValue = bolivarValue / rate
            setEuroAmount(euroValue.toFixed(2))
          }
        }

        return true
      }
      return false
    } catch (error) {
      console.error("Error al cargar tasas desde localStorage:", error)
      return false
    }
  }

  const fetchCurrentRate = async () => {
    try {
      setIsLoading(true)

      const response = await fetch("/api/exchange-rate", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
        },
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      console.log("CurrencyConverter: Tasas recibidas del servidor:", data)

      // Convertir a números para asegurar el formato correcto
      const standardRateValue = Number(data.standardRate)
      const premiumRateValue = Number(data.premiumRate)

      // Solo actualizar si los valores son válidos
      let updated = false

      if (!isNaN(standardRateValue) && standardRateValue > 0) {
        setStandardRate(standardRateValue)
        updated = true
      }

      if (!isNaN(premiumRateValue) && premiumRateValue > 0) {
        setPremiumRate(premiumRateValue)
        updated = true
      }

      if (updated) {
        // Recalcular conversión si hay valores
        if (lastEdited === "euro" && euroAmount) {
          const rate = activeTab === "standard" ? standardRateValue : premiumRateValue
          const euroValue = Number.parseFloat(euroAmount)
          if (!isNaN(euroValue)) {
            const bolivarValue = euroValue * rate
            setBolivarAmount(bolivarValue.toFixed(2))
          }
        } else if (lastEdited === "bolivar" && bolivarAmount) {
          const rate = activeTab === "standard" ? standardRateValue : premiumRateValue
          const bolivarValue = Number.parseFloat(bolivarAmount)
          if (!isNaN(bolivarValue)) {
            const euroValue = bolivarValue / rate
            setEuroAmount(euroValue.toFixed(2))
          }
        }

        // Guardar en localStorage
        const ratesData = {
          standardRate: standardRateValue,
          premiumRate: premiumRateValue,
          lastUpdated: data.lastUpdated || new Date().toISOString(),
        }

        console.log("CurrencyConverter: Guardando tasas en localStorage:", ratesData)
        saveRatesToStorage(ratesData)
      }
    } catch (error) {
      console.error("Error al obtener la tasa:", error)
      // Usar valores iniciales en caso de error
      loadRatesFromStorage() // Intentar cargar desde localStorage como respaldo
    } finally {
      setIsLoading(false)
    }
  }

  const convertEuroToBolivar = (value: string) => {
    if (value === "") {
      setBolivarAmount("")
      return
    }

    const euroValue = Number.parseFloat(value)
    if (!isNaN(euroValue)) {
      // Usar las tasas actuales del estado
      const rate = activeTab === "standard" ? standardRate : premiumRate
      const bolivarValue = euroValue * rate
      setBolivarAmount(bolivarValue.toFixed(2))
    }
  }

  const convertBolivarToEuro = (value: string) => {
    if (value === "") {
      setEuroAmount("")
      return
    }

    const bolivarValue = Number.parseFloat(value)
    if (!isNaN(bolivarValue)) {
      // Usar las tasas actuales del estado
      const rate = activeTab === "standard" ? standardRate : premiumRate
      const euroValue = bolivarValue / rate
      setEuroAmount(euroValue.toFixed(2))
    }
  }

  const handleEuroChange = (value: string) => {
    setEuroAmount(value)
    setLastEdited("euro")
    convertEuroToBolivar(value)
  }

  const handleBolivarChange = (value: string) => {
    setBolivarAmount(value)
    setLastEdited("bolivar")
    convertBolivarToEuro(value)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)

    // Recalcular la conversión con la nueva tasa seleccionada
    if (lastEdited === "euro" && euroAmount) {
      const euroValue = Number.parseFloat(euroAmount)
      if (!isNaN(euroValue)) {
        const rate = value === "standard" ? standardRate : premiumRate
        const bolivarValue = euroValue * rate
        setBolivarAmount(bolivarValue.toFixed(2))
      }
    } else if (lastEdited === "bolivar" && bolivarAmount) {
      const bolivarValue = Number.parseFloat(bolivarAmount)
      if (!isNaN(bolivarValue)) {
        const rate = value === "standard" ? standardRate : premiumRate
        const euroValue = bolivarValue / rate
        setEuroAmount(euroValue.toFixed(2))
      }
    }
  }

  const formatCurrency = (value: string, currency: string) => {
    if (!value) return ""
    const numValue = Number.parseFloat(value)
    if (isNaN(numValue)) return value

    return currency === "EUR"
      ? `€${numValue.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `${numValue.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VES`
  }

  const saveRatesToStorage = (rates: { standardRate: number; premiumRate: number; lastUpdated: string }) => {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(rates))
      console.log("Tasas guardadas en localStorage:", rates)
    } catch (error) {
      console.error("Error al guardar las tasas en localStorage:", error)
    }
  }

  // Si el componente no está montado, mostrar un estado de carga para evitar problemas de hidratación
  if (!isMounted) {
    return (
      <Card className="max-w-md mx-auto shadow-lg border-amber-200">
        <CardHeader className="bg-gradient-to-r from-amber-500 to-amber-400 text-white">
          <CardTitle className="text-center text-2xl">Conversor de Divisas</CardTitle>
          <CardDescription className="text-white/90 text-center">EUR/VES</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 pb-4">
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-amber-500 mr-2" />
            <span>Cargando conversor...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-md mx-auto shadow-lg border-amber-200">
      <CardHeader className="bg-gradient-to-r from-amber-500 to-amber-400 text-white">
        <CardTitle className="text-center text-2xl">Conversor de Divisas</CardTitle>
        <CardDescription className="text-white/90 text-center">EUR/VES</CardDescription>
      </CardHeader>
      <CardContent className="pt-6 pb-4">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <Calculator className="h-5 w-5 text-blue-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Ingrese un valor en cualquiera de los campos para calcular automáticamente la conversión según la tasa
                seleccionada.
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="standard" value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="standard" className="text-sm">
              Tasa Estándar
            </TabsTrigger>
            <TabsTrigger value="premium" className="text-sm">
              Tasa Premium
            </TabsTrigger>
          </TabsList>

          <TabsContent value="standard" className="mt-0">
            <ClientOnly fallback={<div className="text-center mb-4 h-10 animate-pulse bg-gray-100 rounded"></div>}>
              {() => (
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-amber-600">1 EUR = {standardRate} VES</div>
                  <p className="text-sm text-gray-500">Tasa estándar para usuarios no registrados</p>
                </div>
              )}
            </ClientOnly>
          </TabsContent>

          <TabsContent value="premium" className="mt-0">
            <ClientOnly fallback={<div className="text-center mb-4 h-10 animate-pulse bg-gray-100 rounded"></div>}>
              {() => (
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-green-600">1 EUR = {premiumRate} VES</div>
                  <p className="text-sm text-green-600 font-medium">Tasa premium exclusiva para usuarios registrados</p>
                </div>
              )}
            </ClientOnly>
          </TabsContent>
        </Tabs>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="euroAmount">Cantidad en Euros (EUR)</Label>
            <div className="relative">
              <Euro className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
              <Input
                id="euroAmount"
                type="number"
                value={euroAmount}
                onChange={(e) => handleEuroChange(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex justify-center my-2">
            <ArrowDown className="h-6 w-6 text-amber-500" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bolivarAmount">Cantidad en Bolívares (VES)</Label>
            <Input
              id="bolivarAmount"
              type="number"
              value={bolivarAmount}
              onChange={(e) => handleBolivarChange(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>

          {euroAmount && bolivarAmount ? (
            <ClientOnly fallback={<div className="p-4 text-center">Cargando...</div>}>
              {() => (
                <div className="mt-4 p-3 bg-amber-50 rounded-md text-center">
                  <p className="text-amber-800 font-medium">
                    {formatCurrency(euroAmount, "EUR")} = {formatCurrency(bolivarAmount, "VES")}
                  </p>
                </div>
              )}
            </ClientOnly>
          ) : (
            <div className="mt-4 p-3 bg-gray-50 rounded-md text-center">
              <p className="text-gray-600 text-sm">
                Ingrese una cantidad en euros o bolívares para ver la conversión automáticamente.
              </p>
            </div>
          )}
        </div>

        <Button
          onClick={fetchCurrentRate}
          variant="outline"
          className="w-full mt-6 border-amber-400 text-amber-600 hover:bg-amber-50"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Obtener Tasas Actuales
        </Button>
      </CardContent>
    </Card>
  )
}

function ArrowDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </svg>
  )
}
