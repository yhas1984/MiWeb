"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { getRatesFromStorage, fetchRatesFromServer } from "@/lib/exchange-rate-service-client"

// Definir la estructura de los datos de tasas
interface RatesData {
  standardRate: number
  premiumRate: number
  lastUpdated: string
}

// Definir la estructura del contexto
interface RatesContextType {
  rates: RatesData
  isLoading: boolean
  refreshRates: () => Promise<void>
  updateRatesInContext: (newRates: RatesData) => void
}

// Crear el contexto con valores por defecto
const RatesContext = createContext<RatesContextType>({
  rates: {
    standardRate: 0,
    premiumRate: 0,
    lastUpdated: new Date().toISOString(),
  },
  isLoading: true,
  refreshRates: async () => {},
  updateRatesInContext: () => {},
})

// Hook personalizado para usar el contexto
export const useRates = () => useContext(RatesContext)

// Proveedor del contexto
export function RatesProvider({ children }: { children: ReactNode }) {
  // Estado para almacenar las tasas
  const [rates, setRates] = useState<RatesData>({
    standardRate: 0,
    premiumRate: 0,
    lastUpdated: new Date().toISOString(),
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  // Función para actualizar las tasas desde el servidor
  const refreshRates = async () => {
    try {
      setIsLoading(true)
      const serverRates = await fetchRatesFromServer(true)
      setRates(serverRates)
    } catch (error) {
      console.error("Error al actualizar tasas:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Función para actualizar las tasas en el contexto (usado por otros componentes)
  const updateRatesInContext = (newRates: RatesData) => {
    setRates(newRates)
  }

  // Inicializar las tasas al montar el componente
  useEffect(() => {
    if (!isInitialized) {
      const initRates = async () => {
        try {
          // Primero cargar desde localStorage para tener algo inmediatamente
          const storedRates = getRatesFromStorage()
          setRates(storedRates)

          // Luego intentar obtener del servidor
          await refreshRates()
        } catch (error) {
          console.error("Error al inicializar tasas:", error)
        } finally {
          setIsLoading(false)
          setIsInitialized(true)
        }
      }

      initRates()
    }
  }, [isInitialized])

  // Escuchar eventos de actualización de tasas
  useEffect(() => {
    const handleRatesUpdated = (event: CustomEvent) => {
      const { standardRate, premiumRate, lastUpdated } = event.detail
      console.log("Evento ratesUpdated recibido en contexto:", event.detail)
      setRates({
        standardRate,
        premiumRate,
        lastUpdated,
      })
    }

    window.addEventListener("ratesUpdated", handleRatesUpdated as EventListener)

    return () => {
      window.removeEventListener("ratesUpdated", handleRatesUpdated as EventListener)
    }
  }, [])

  return (
    <RatesContext.Provider value={{ rates, isLoading, refreshRates, updateRatesInContext }}>
      {children}
    </RatesContext.Provider>
  )
}
