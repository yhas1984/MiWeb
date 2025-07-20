"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, CheckCircle, XCircle, Download } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

interface FaviconStatus {
  path: string
  exists: boolean
}

export default function CheckFaviconPage() {
  const [password, setPassword] = useState("")
  const { isAuthenticated, login, isLoading: authLoading } = useAuth()
  const [faviconStatus, setFaviconStatus] = useState<FaviconStatus[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const { toast } = useToast()

  // Lista de archivos de favicon que deberían existir
  const faviconPaths = [
    "/favicon.ico",
    "/icon.png",
    "/apple-icon.png",
    "/site.webmanifest",
    "/icons/favicon-16x16.png",
    "/icons/favicon-32x32.png",
    "/icons/favicon-48x48.png",
    "/icons/favicon-64x64.png",
    "/icons/favicon-128x128.png",
    "/icons/favicon-256x256.png",
  ]

  // Función para verificar si los archivos existen
  const checkFavicons = async () => {
    setIsChecking(true)

    try {
      const response = await fetch("/api/check-favicon")
      const data = await response.json()

      setFaviconStatus(data.status)
    } catch (error) {
      console.error("Error al verificar favicons:", error)
      toast({
        title: "Error",
        description: "No se pudieron verificar los archivos de favicon",
        variant: "destructive",
      })
    } finally {
      setIsChecking(false)
    }
  }

  // Verificar favicons al cargar la página
  useEffect(() => {
    if (isAuthenticated) {
      checkFavicons()
    }
  }, [isAuthenticated])

  // Función para generar los favicons
  const generateFavicons = async () => {
    try {
      // Asegurarse de que localStorage esté disponible
      const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null

      const response = await fetch("/api/generate-favicon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Éxito",
          description: "Favicons generados correctamente",
        })

        // Verificar nuevamente el estado
        checkFavicons()
      } else {
        throw new Error(data.message || "Error al generar favicons")
      }
    } catch (error) {
      console.error("Error al generar favicons:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al generar favicons",
        variant: "destructive",
      })
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
              Ingresa la contraseña de administrador para verificar el estado de los favicons.
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
      <h1 className="text-3xl font-bold mb-8">Estado de los Favicons</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Verificación de Archivos</CardTitle>
          <CardDescription>
            Comprueba si todos los archivos de favicon necesarios existen en el servidor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isChecking ? (
            <div className="text-center py-4">Verificando archivos...</div>
          ) : faviconStatus.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {faviconStatus.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center">
                      {item.exists ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <span className="text-sm font-mono">{item.path}</span>
                    </div>
                    {item.exists && (
                      <a
                        href={item.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 text-sm"
                      >
                        Ver
                      </a>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-600">
                    {faviconStatus.every((item) => item.exists)
                      ? "✅ Todos los archivos de favicon existen."
                      : `❌ Faltan ${faviconStatus.filter((item) => !item.exists).length} archivos de favicon.`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={checkFavicons} disabled={isChecking}>
                    Verificar de nuevo
                  </Button>
                  {!faviconStatus.every((item) => item.exists) && (
                    <Button onClick={generateFavicons} className="bg-amber-500 hover:bg-amber-600">
                      <Download className="h-4 w-4 mr-2" />
                      Generar Favicons
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-4">No se ha podido verificar el estado de los favicons.</p>
              <Button onClick={checkFavicons}>Verificar ahora</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h2 className="text-xl font-semibold text-blue-800 mb-4">Instrucciones para solucionar problemas de favicon</h2>
        <ol className="list-decimal pl-5 space-y-2 text-blue-700">
          <li>Verifica que todos los archivos de favicon existen en el servidor.</li>
          <li>Si faltan archivos, haz clic en "Generar Favicons" para crearlos automáticamente.</li>
          <li>Limpia la caché de tu navegador para ver los cambios (Ctrl+F5 o Cmd+Shift+R).</li>
          <li>
            Verifica que el archivo <code className="bg-blue-100 px-1 rounded">layout.tsx</code> tenga las referencias
            correctas a los favicons.
          </li>
          <li>
            Si los problemas persisten, intenta usar una ventana de incógnito para verificar si es un problema de caché.
          </li>
        </ol>
      </div>
    </div>
  )
}
