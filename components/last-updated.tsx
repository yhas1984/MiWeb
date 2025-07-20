"use client"

import { useEffect, useState } from "react"
import { formatDate } from "@/lib/rates-service"
import { ClientOnly } from "@/lib/client-only"

interface LastUpdatedProps {
  lastUpdated: string
  isLoading?: boolean
}

export function LastUpdated({ lastUpdated, isLoading = false }: LastUpdatedProps) {
  const [formattedDate, setFormattedDate] = useState<string>("")

  useEffect(() => {
    if (lastUpdated) {
      setFormattedDate(formatDate(lastUpdated))
    }
  }, [lastUpdated])

  return (
    <ClientOnly fallback={<p className="text-xs text-gray-400 mt-4">Cargando última actualización...</p>}>
      {() => (
        <p className="text-xs text-gray-400 mt-4">
          {isLoading ? (
            "Actualizando tasas..."
          ) : formattedDate ? (
            <>Última actualización: {formattedDate}</>
          ) : (
            "Última actualización no disponible"
          )}
        </p>
      )}
    </ClientOnly>
  )
}
