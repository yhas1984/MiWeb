"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, AlertTriangle, Download } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function FaviconManualPage() {
  const [password, setPassword] = useState("")
  const { isAuthenticated, login, isLoading: authLoading } = useAuth()
  const [isDownloading, setIsDownloading] = useState(false)
  const { toast } = useToast()

  // Función para descargar el favicon
  const downloadFavicon = async () => {
    setIsDownloading(true)

    try {
      // URL del logo
      const logoUrl =
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-03-05%20at%2015.49.43-uEHU6vvrZTFLABzyO55Lhcb201Bdkx.jpeg"

      // Descargar la imagen
      const response = await fetch(logoUrl)
      const blob = await response.blob()

      // Crear un enlace de descarga
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = "favicon.ico"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Éxito",
        description: "Favicon descargado correctamente. Súbelo manualmente a la carpeta 'public' de tu proyecto.",
      })
    } catch (error) {
      console.error("Error al descargar favicon:", error)
      toast({
        title: "Error",
        description: "No se pudo descargar el favicon",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
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
      <h1 className="text-3xl font-bold mb-8">Solución Manual de Favicon</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Descargar y Subir Favicon Manualmente</CardTitle>
          <CardDescription>
            Esta herramienta te permite descargar el logo para usarlo como favicon y subirlo manualmente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                <div>
                  <h3 className="font-medium text-amber-800">Solución manual</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Debido a problemas con la generación automática de favicons, te recomendamos seguir estos pasos
                    manuales:
                  </p>
                  <ol className="list-decimal pl-5 mt-2 space-y-1 text-sm text-amber-700">
                    <li>Descarga el logo usando el botón de abajo</li>
                    <li>Renómbralo a "favicon.ico", "icon.png" y "apple-touch-icon.png"</li>
                    <li>Sube estos archivos a la carpeta "public" de tu proyecto</li>
                    <li>Crea un archivo "site.webmanifest" con el contenido proporcionado abajo</li>
                  </ol>
                </div>
              </div>
            </div>

            <Button
              onClick={downloadFavicon}
              className="bg-amber-500 hover:bg-amber-600 w-full"
              disabled={isDownloading}
            >
              {isDownloading ? (
                "Descargando..."
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Logo
                </>
              )}
            </Button>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Contenido para site.webmanifest</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                <pre className="text-xs overflow-x-auto">
                  {`{
  "name": "Tu Envio Express",
  "short_name": "Tu Envio Express",
  "icons": [
    {
      "src": "/icon.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ],
  "theme_color": "#f59e0b",
  "background_color": "#ffffff",
  "display": "standalone"
}`}
                </pre>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Copia este contenido y guárdalo como "site.webmanifest" en la carpeta "public".
              </p>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Limpiar caché del navegador</h3>
              <p className="text-sm text-gray-600 mb-3">
                Si el favicon no se muestra después de subirlo, puede ser necesario limpiar la caché del navegador.
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
        <h2 className="text-xl font-semibold text-blue-800 mb-4">Instrucciones adicionales</h2>
        <ol className="list-decimal pl-5 space-y-2 text-blue-700">
          <li>
            Asegúrate de que los archivos tengan los nombres exactos: "favicon.ico", "icon.png", "apple-touch-icon.png"
            y "site.webmanifest"
          </li>
          <li>Todos estos archivos deben estar en la raíz de la carpeta "public"</li>
          <li>Después de subir los archivos, limpia la caché del navegador y recarga la página</li>
          <li>Si los problemas persisten, intenta abrir el sitio en una ventana de incógnito o en otro navegador</li>
          <li>También puedes intentar forzar una recarga completa con Ctrl+F5 (Windows) o Cmd+Shift+R (Mac)</li>
        </ol>
      </div>
    </div>
  )
}
