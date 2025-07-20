"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Check, RefreshCw } from "lucide-react"
import JSZip from "jszip"

export default function GenerateFavicon() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  // Logo URL from the website
  const logoUrl =
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-03-05%20at%2015.49.43-uEHU6vvrZTFLABzyO55Lhcb201Bdkx.jpeg"

  useEffect(() => {
    // Preload the image
    imageRef.current = new Image()
    imageRef.current.crossOrigin = "anonymous"
    imageRef.current.src = logoUrl
  }, [])

  const generateFavicon = async () => {
    if (!canvasRef.current || !imageRef.current) return

    setIsGenerating(true)
    setIsComplete(false)

    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        throw new Error("Could not get canvas context")
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw image centered and cropped to a square
      const img = imageRef.current

      // Wait for image to load if it hasn't already
      if (!img.complete) {
        await new Promise((resolve) => {
          img.onload = resolve
        })
      }

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

      setIsComplete(true)
    } catch (error) {
      console.error("Error generating favicon:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadFavicon = () => {
    if (!canvasRef.current) return

    // Create different sizes for favicon
    const sizes = [16, 32, 48, 64, 128, 256]
    const zip = new JSZip()

    // Create a folder for the icons
    const iconsFolder = zip.folder("favicon")

    // Promise to generate all sizes
    const generatePromises = sizes.map((size) => {
      return new Promise<void>((resolve) => {
        const tempCanvas = document.createElement("canvas")
        tempCanvas.width = size
        tempCanvas.height = size
        const tempCtx = tempCanvas.getContext("2d")

        if (tempCtx && canvasRef.current) {
          tempCtx.drawImage(canvasRef.current, 0, 0, size, size)

          tempCanvas.toBlob((blob) => {
            if (blob && iconsFolder) {
              iconsFolder.file(`favicon-${size}x${size}.png`, blob)
            }
            resolve()
          }, "image/png")
        } else {
          resolve()
        }
      })
    })

    // Generate favicon.ico (32x32)
    const faviconPromise = new Promise<void>((resolve) => {
      if (canvasRef.current) {
        canvasRef.current.toBlob((blob) => {
          if (blob && iconsFolder) {
            iconsFolder.file("favicon.ico", blob)
          }
          resolve()
        }, "image/x-icon")
      } else {
        resolve()
      }
    })

    // Wait for all promises to complete
    Promise.all([...generatePromises, faviconPromise]).then(() => {
      // Generate zip file
      zip.generateAsync({ type: "blob" }).then((content) => {
        // Create download link
        const link = document.createElement("a")
        link.href = URL.createObjectURL(content)
        link.download = "favicon.zip"
        link.click()
      })
    })
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Generador de Favicon</CardTitle>
        <CardDescription>Genera un favicon a partir del logo de Tu Envio Express</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <canvas ref={canvasRef} width={256} height={256} className="border rounded-full bg-white" />
        </div>

        <div className="flex justify-center">
          <Button onClick={generateFavicon} disabled={isGenerating} className="mr-2">
            {isGenerating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              "Generar Favicon"
            )}
          </Button>

          <Button onClick={downloadFavicon} disabled={!isComplete || isGenerating} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Descargar
          </Button>
        </div>
      </CardContent>
      <CardFooter className="text-sm text-gray-500">
        {isComplete && (
          <div className="flex items-center text-green-600 w-full justify-center">
            <Check className="mr-2 h-4 w-4" />
            Favicon generado correctamente. Puedes descargarlo ahora.
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
