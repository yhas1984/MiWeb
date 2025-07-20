"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import GenerateFavicon from "@/scripts/generate-favicon"

// Ya no se necesita el import de next/dynamic aquí

export default function FaviconGeneratorPage() {
  const [password, setPassword] = useState("")
  const { isAuthenticated, login, isLoading: authLoading } = useAuth()
  // Estado para rastrear si JSZip se ha cargado
  const [isJsZipLoaded, setIsJsZipLoaded] = useState(false)

  // Usamos useEffect para cargar JSZip de forma segura en el cliente
  useEffect(() => {
    // Importamos la librería dinámicamente
    import("jszip").then(JSZipModule => {
      // Una vez cargada, la asignamos al objeto window para que
      // el componente GenerateFavicon pueda acceder a ella.
      ;(window as any).JSZip = JSZipModule.default
      // Actualizamos el estado para indicar que la librería está lista
      setIsJsZipLoaded(true)
    }).catch(error => {
      console.error("Error al cargar la librería JSZip:", error)
    })
  }, []) // El array vacío asegura que este efecto se ejecute solo una vez

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
              Ingresa la contraseña de administrador para acceder al generador de favicon.
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
      <h1 className="text-3xl font-bold mb-8">Generador de Favicon</h1>
      
      {/* Renderizamos el componente solo cuando JSZip está listo */}
      {isJsZipLoaded ? <GenerateFavicon /> : <p>Cargando herramientas de generación...</p>}

      <div className="mt-8 max-w-md mx-auto bg-blue-50 p-4 rounded-md border border-blue-200">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">Instrucciones</h2>
        <ol className="list-decimal pl-5 space-y-2 text-blue-700">
          <li>Haz clic en "Generar Favicon" para crear una vista previa.</li>
          <li>Haz clic en "Descargar" para obtener un archivo ZIP con diferentes tamaños de favicon.</li>
          <li>Extrae el archivo ZIP y coloca el archivo favicon.ico en la carpeta "public" de tu proyecto.</li>
          <li>Coloca los demás archivos PNG en la carpeta "public/icons" para soporte de diferentes dispositivos.</li>
          <li>Actualiza el archivo layout.tsx para incluir los enlaces a los favicons.</li>
        </ol>
      </div>
    </div>
  )
}
