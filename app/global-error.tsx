"use client"

import { Button } from "@/components/ui/button"
import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Opcional: registrar el error en un servicio de monitoreo
    console.error(error)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <div className="space-y-6 max-w-md">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl text-red-600">Error</h1>
              <h2 className="text-2xl font-bold tracking-tighter">Algo salió mal</h2>
              <p className="text-gray-500 md:text-lg">
                Lo sentimos, ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.
              </p>
            </div>
            <Button onClick={() => reset()} className="bg-amber-500 hover:bg-amber-600">
              Intentar de nuevo
            </Button>
          </div>
        </div>
      </body>
    </html>
  )
}
