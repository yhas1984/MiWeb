"use client"

import { useEffect } from "react"
import { saveRates } from "@/lib/rates-service"
import { useHasMounted } from "@/lib/client-only"
import { getInitialRates } from "@/lib/server-utils"

interface RatesInitializerProps {
  standardRate: number
  premiumRate: number
  lastUpdated: string
}

export function RatesInitializer({ standardRate, premiumRate, lastUpdated }: RatesInitializerProps) {
  const hasMounted = useHasMounted()

  useEffect(() => {
    if (!hasMounted) return

    // Primero guardamos las tasas iniciales en localStorage
    const initialRates = {
      standardRate,
      premiumRate,
      lastUpdated,
    }

    saveRates(initialRates)

    // Luego intentamos obtener las tasas más actualizadas del servidor
    const fetchLatestRates = async () => {
      try {
        const latestRates = await getInitialRates()

        // Solo actualizamos si las tasas son diferentes
        if (latestRates.standardRate !== standardRate || latestRates.premiumRate !== premiumRate) {
          saveRates(latestRates)

          // Disparar evento para notificar a otros componentes
          const event = new CustomEvent("ratesUpdated", {
            detail: latestRates,
          })
          window.dispatchEvent(event)

          console.log("RatesInitializer: Tasas actualizadas desde el servidor", latestRates)
        }
      } catch (error) {
        console.error("Error al obtener tasas actualizadas:", error)
      }
    }

    fetchLatestRates()

    console.log("RatesInitializer: Tasas iniciales guardadas", initialRates)
  }, [standardRate, premiumRate, lastUpdated, hasMounted])

  // Este componente no renderiza nada visible
  return null
}
