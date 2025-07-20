import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import https from "https"
import { createCanvas, loadImage } from "canvas"

// Función para descargar una imagen
async function downloadImage(url: string, filepath: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    // Asegurarse de que el directorio existe
    const dir = path.dirname(filepath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    const file = fs.createWriteStream(filepath)
    https
      .get(url, (response) => {
        response.pipe(file)
        file.on("finish", () => {
          file.close()
          resolve(true)
        })
      })
      .on("error", (err) => {
        fs.unlink(filepath, () => {}) // Eliminar archivo parcial
        reject(err)
      })
  })
}

// Función para generar un favicon circular
async function generateCircularFavicon(inputPath: string, outputPath: string, size: number): Promise<boolean> {
  try {
    const canvas = createCanvas(size, size)
    const ctx = canvas.getContext("2d")

    // Cargar la imagen
    const image = await loadImage(inputPath)

    // Calcular dimensiones para recortar un cuadrado del centro
    const minDimension = Math.min(image.width, image.height)
    const offsetX = (image.width - minDimension) / 2
    const offsetY = (image.height - minDimension) / 2

    // Dibujar un círculo y recortar la imagen
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()

    // Dibujar la imagen recortada
    ctx.drawImage(
      image,
      offsetX,
      offsetY,
      minDimension,
      minDimension, // Recortar un cuadrado
      0,
      0,
      size,
      size, // Dibujar en todo el canvas
    )

    // Guardar la imagen
    const buffer = canvas.toBuffer("image/png")
    fs.writeFileSync(outputPath, buffer)

    return true
  } catch (error) {
    console.error("Error al generar favicon circular:", error)
    return false
  }
}

export async function GET() {
  try {
    // URL del logo
    const logoUrl =
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-03-05%20at%2015.49.43-uEHU6vvrZTFLABzyO55Lhcb201Bdkx.jpeg"

    // Rutas de archivos
    const tempLogoPath = path.join(process.cwd(), "public", "temp-logo.jpg")
    const faviconPath = path.join(process.cwd(), "public", "favicon.ico")
    const iconPath = path.join(process.cwd(), "public", "icon.png")
    const appleTouchPath = path.join(process.cwd(), "public", "apple-touch-icon.png")

    // Descargar el logo si no existe
    if (!fs.existsSync(tempLogoPath)) {
      await downloadImage(logoUrl, tempLogoPath)
    }

    // Generar los favicons en diferentes tamaños
    await generateCircularFavicon(tempLogoPath, faviconPath, 32)
    await generateCircularFavicon(tempLogoPath, iconPath, 192)
    await generateCircularFavicon(tempLogoPath, appleTouchPath, 180)

    // Crear el archivo site.webmanifest
    const webmanifest = {
      name: "Tu Envio Express",
      short_name: "Tu Envio Express",
      icons: [
        {
          src: "/icon.png",
          sizes: "192x192",
          type: "image/png",
        },
      ],
      theme_color: "#f59e0b",
      background_color: "#ffffff",
      display: "standalone",
    }

    fs.writeFileSync(path.join(process.cwd(), "public", "site.webmanifest"), JSON.stringify(webmanifest, null, 2))

    return NextResponse.json({
      success: true,
      message: "Favicons generados correctamente",
      files: {
        favicon: "/favicon.ico",
        icon: "/icon.png",
        appleTouchIcon: "/apple-touch-icon.png",
        webmanifest: "/site.webmanifest",
      },
    })
  } catch (error) {
    console.error("Error al generar favicons:", error)
    return NextResponse.json({ success: false, message: "Error al generar favicons" }, { status: 500 })
  }
}
