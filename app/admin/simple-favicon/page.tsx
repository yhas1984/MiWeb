"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, CheckCircle, RefreshCw, AlertTriangle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function SimpleFaviconPage() {
  const [password, setPassword] = useState("")
  const { isAuthenticated, login, isLoading: authLoading } = useAuth()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [faviconFiles, setFaviconFiles] = useState<string[]>([])
  const { toast } = useToast()

  const generateFavicons = async () => {
    setIsGenerating(true)
    setIsSuccess(false)
    setError(null)

    try {
      const response = await fetch("/api/simple-favicon")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setIsSuccess(true)
        setFaviconFiles(Object.values(data.files))

        toast({
          title: "Éxito",
          description: "Archivos de favicon copiados correctamente",
        })
      } else {
        throw new Error(data.message || "Error al generar favicons")
      }
    } catch (error) {
      console.error("Error al generar favicons:", error)
      setError(error instanceof Error ? error.message : String(error))
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al generar favicons",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const clearCache = () => {
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name)
        })
      })
      toast({
        title: "Caché limpiada",
        description: "Se ha limpiado la caché del navegador",
      })
    } else {
      toast({
        title: "No soportado",
        description: "Tu navegador no soporta la API de caché",
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
              Ingresa la contraseña de administrador para acceder a la herramienta de favicon.
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
      <h1 className="text-3xl font-bold mb-8">Solución Simple de Favicon</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Copiar Logo como Favicon</CardTitle>
          <CardDescription>Esta herramienta copiará el logo como favicon sin procesamiento adicional.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-red-800">Error al generar favicons</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={generateFavicons}
              className="bg-amber-500 hover:bg-amber-600 w-full"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Copiar Logo como Favicon"
              )}
            </Button>

            {isSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center mb-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <h3 className="font-medium text-green-800">Archivos copiados correctamente</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                  {faviconFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                      <span className="text-sm font-mono">{file}</span>
                      <a
                        href={file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 text-sm"
                      >
                        Ver
                      </a>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-green-700">Los archivos han sido copiados a la carpeta public.</p>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Limpiar caché del navegador</h3>
              <p className="text-sm text-gray-600 mb-3">
                Si el favicon no se muestra después de copiarlo, puede ser necesario limpiar la caché del navegador.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={clearCache}>
                  Limpiar caché
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Recargar página
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h2 className="text-xl font-semibold text-blue-800 mb-4">Instrucciones para solucionar problemas de favicon</h2>
        <ol className="list-decimal pl-5 space-y-2 text-blue-700">
          <li>Haz clic en "Copiar Logo como Favicon" para crear todos los archivos necesarios.</li>
          <li>Verifica que los archivos se hayan copiado correctamente haciendo clic en "Ver" junto a cada archivo.</li>
          <li>Limpia la caché del navegador haciendo clic en "Limpiar caché".</li>
          <li>Recarga la página para ver los cambios.</li>
          <li>Si los problemas persisten, intenta abrir el sitio en una ventana de incógnito o en otro navegador.</li>
          <li>También puedes intentar forzar una recarga completa con Ctrl+F5 (Windows) o Cmd+Shift+R (Mac).</li>
        </ol>
      </div>
    </div>
  )
}
