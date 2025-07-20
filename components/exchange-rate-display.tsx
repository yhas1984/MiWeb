"use client"

import { useState, useEffect } from "react"
import { ClientOnly } from "@/lib/client-only"

interface ExchangeRateDisplayProps {
  initialRate?: number
  isPremium?: boolean
  className?: string
  showLabel?: boolean
}

export function ExchangeRateDisplay({
  initialRate,
  isPremium = false,
  className = "",
  showLabel = true,
}: ExchangeRateDisplayProps) {
  const [rate, setRate] = useState<number | null>(initialRate || null)
  const [loading, setLoading] = useState(!initialRate)

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const response = await fetch("/api/exchange-rate", {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setRate(isPremium ? Number(data.premiumRate) : Number(data.standardRate))
        }
      } catch (error) {
        console.error("Error fetching exchange rate:", error)
      } finally {
        setLoading(false)
      }
    }

    // Si no tenemos una tasa inicial, la obtenemos
    if (!initialRate) {
      fetchRate()
    }

    // Escuchar eventos de actualización de tasas
    const handleRatesUpdated = () => {
      fetchRate()
    }

    window.addEventListener("ratesUpdated", handleRatesUpdated)

    return () => {
      window.removeEventListener("ratesUpdated", handleRatesUpdated)
    }
  }, [initialRate, isPremium])

  return (
    <ClientOnly
      fallback={
        <div className={`flex flex-col ${className}`}>
          <div className="text-3xl font-bold">€ 1 = ... VES</div>
          {showLabel && (
            <div className="text-sm text-gray-600 mt-1">
              {isPremium ? "Tasa premium para usuarios registrados" : "Tasa estándar para usuarios no registrados"}
            </div>
          )}
        </div>
      }
    >
      {() => (
        <div className={`flex flex-col ${className}`}>
          <div className="text-3xl font-bold">
            {loading ? <span>€ 1 = ... VES</span> : <span>€ 1 = {rate} VES</span>}
          </div>
          {showLabel && (
            <div className="text-sm text-gray-600 mt-1">
              {isPremium ? "Tasa premium para usuarios registrados" : "Tasa estándar para usuarios no registrados"}
            </div>
          )}
        </div>
      )}
    </ClientOnly>
  )
}
