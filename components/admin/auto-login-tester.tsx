"use client"

import { useEffect, useState } from "react"
import { useUser } from "@/contexts/user-context"
import { Button } from "@/components/ui/button"
import { RefreshCw, Play, Pause } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function AutoLoginTester() {
  const [isRunning, setIsRunning] = useState(false)
  const [cycleCount, setCycleCount] = useState(0)
  const [testEmail, setTestEmail] = useState("test@example.com")
  const { isLoggedIn, login, logout } = useUser()
  const { toast } = useToast()

  // Function to toggle login state
  const toggleLoginState = () => {
    if (isLoggedIn) {
      logout()
      console.log(`Ciclo ${cycleCount}: Usuario desconectado`)
    } else {
      login(testEmail)
      console.log(`Ciclo ${cycleCount}: Usuario conectado como ${testEmail}`)
      setCycleCount((prev) => prev + 1)
    }
  }

  // Effect to run the automatic login/logout cycle
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning) {
      // Set global flag to disable toasts during testing
      window.autoLoginTesting = true

      // Toggle login state immediately when starting
      toggleLoginState()

      // Set up interval to toggle login state every second
      interval = setInterval(() => {
        toggleLoginState()
      }, 1000)

      // Show a single toast when starting
      toast({
        title: "Prueba iniciada",
        description: "Alternando inicio/cierre de sesión cada segundo",
      })
    } else if (interval) {
      // Remove global flag when stopping
      window.autoLoginTesting = false

      // Show a single toast when stopping
      if (cycleCount > 0) {
        toast({
          title: "Prueba detenida",
          description: `Completados ${cycleCount} ciclos de inicio/cierre de sesión`,
        })
      }
    }

    // Clean up interval on unmount or when stopping
    return () => {
      if (interval) {
        clearInterval(interval)
        window.autoLoginTesting = false
      }
    }
  }, [isRunning]) // Only re-run when isRunning changes

  return (
    <div className="w-full">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Probador de Inicio de Sesión</h3>
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">Ciclos: {cycleCount}</span>
            <Button
              size="sm"
              variant={isRunning ? "destructive" : "default"}
              onClick={() => setIsRunning(!isRunning)}
              className={isRunning ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}
            >
              {isRunning ? (
                <>
                  <Pause className="h-4 w-4 mr-1" />
                  Detener
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Iniciar
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className={`h-3 w-3 rounded-full ${isLoggedIn ? "bg-green-500" : "bg-red-500"}`}></div>
          <span className="text-sm">Estado: {isLoggedIn ? "Conectado" : "Desconectado"}</span>
        </div>

        <div className="text-xs text-gray-500">
          {isRunning ? (
            <div className="flex items-center">
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Alternando cada segundo...
            </div>
          ) : (
            "Presiona Iniciar para comenzar el ciclo"
          )}
        </div>
      </div>
    </div>
  )
}
