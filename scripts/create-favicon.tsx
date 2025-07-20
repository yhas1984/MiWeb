"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CreateFavicon() {
  const [isGenerating, setIsGenerating] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Logo URL from the website
  const logoUrl =
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-03-05%20at%2015.49.43-uEHU6vvrZTFLABzyO55Lhcb201Bdkx.jpeg"

  const generateFavicon = async () => {
    if (!canvasRef.current) return

    setIsGenerating(true)

    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        throw new Error("Could not get canvas context")
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Create image
      const img = new Image()
      img.crossOrigin = "anonymous"

      // Wait for image to load
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error("Failed to load image"))
        img.src = logoUrl
      })

      // Calculate the square crop
      const size = Math.min(img.width, img.height)
      const offsetX = (img.width - size) / 2
      const offsetY = (img.height - size) / 2

      // Draw the image cropped to a square
      ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, canvas.width, canvas.height)

      // Add a circular mask
      ctx.globalCompositeOperation = "destination-in"
      ctx.beginPath()
      ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.fill()

      // Reset composite operation
      ctx.globalCompositeOperation = "source-over"

      // Set preview URL
      setPreviewUrl(canvas.toDataURL("image/png"))
    } catch (error) {
      console.error("Error generating favicon:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadFavicon = () => {
    if (!canvasRef.current || !previewUrl) return

    const link = document.createElement("a")
    link.href = previewUrl
    link.download = "favicon.png"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Generador de Favicon Simple</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <canvas ref={canvasRef} width={64} height={64} className="border rounded-full bg-white" />
        </div>

        {previewUrl && (
          <div className="flex justify-center">
            <div className="text-center">
              <p className="text-sm mb-2">Vista previa:</p>
              <img
                src={previewUrl || "/placeholder.svg"}
                alt="Favicon Preview"
                className="w-16 h-16 mx-auto border rounded-full"
              />
            </div>
          </div>
        )}

        <div className="flex justify-center gap-2">
          <Button onClick={generateFavicon} disabled={isGenerating}>
            {isGenerating ? "Generando..." : "Generar Favicon"}
          </Button>

          <Button onClick={downloadFavicon} disabled={!previewUrl} variant="outline">
            Descargar
          </Button>
        </div>

        <div className="text-sm text-gray-500 mt-4">
          <p>Instrucciones:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Haz clic en "Generar Favicon"</li>
            <li>Descarga el archivo</li>
            <li>Coloca el archivo en la carpeta "public" de tu proyecto con el nombre "icon.png"</li>
            <li>También crea una copia llamada "favicon.ico" y "apple-icon.png"</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
