"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AIChat } from "@/components/ai-chat"
// Importación correcta de los iconos
import { MessageCircle, X } from "lucide-react"

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Cerrar el chat cuando se navega a otra página
  useEffect(() => {
    const handleRouteChange = () => {
      setIsOpen(false)
    }

    window.addEventListener("popstate", handleRouteChange)

    return () => {
      window.removeEventListener("popstate", handleRouteChange)
    }
  }, [])

  const handleToggle = () => {
    setIsOpen(!isOpen)
    // Resetear el estado de error al abrir el chat
    if (!isOpen) {
      setHasError(false)
    }
  }

  const handleError = (error: string) => {
    console.error("Error en el chat flotante:", error)
    setHasError(true)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <Card className="w-80 md:w-96 shadow-lg border-amber-200 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-amber-400 text-white p-3 flex justify-between items-center">
            <h3 className="font-medium">Asistente Virtual</h3>
            <Button variant="ghost" size="icon" onClick={handleToggle} className="text-white hover:bg-amber-600">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <AIChat isFloating={true} onError={handleError} />
        </Card>
      ) : (
        <Button
          onClick={handleToggle}
          className={`rounded-full w-14 h-14 shadow-lg ${
            hasError ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600"
          }`}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  )
}
