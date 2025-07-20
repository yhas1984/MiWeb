import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import https from "https"

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

export async function GET() {
  try {
    // URL del logo
    const logoUrl =
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-03-05%20at%2015.49.43-uEHU6vvrZTFLABzyO55Lhcb201Bdkx.jpeg"

    // Rutas de archivos
    const publicDir = path.join(process.cwd(), "public")
    const logoPath = path.join(publicDir, "logo.jpg")
    const faviconPath = path.join(publicDir, "favicon.ico")
    const iconPath = path.join(publicDir, "icon.png")
    const appleTouchPath = path.join(publicDir, "apple-touch-icon.png")

    // Crear directorio public si no existe
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true })
    }

    // Descargar el logo si no existe
    if (!fs.existsSync(logoPath)) {
      await downloadImage(logoUrl, logoPath)
    }

    // Copiar el logo como favicon.ico, icon.png y apple-touch-icon.png
    // En lugar de generar nuevas imágenes, simplemente usamos el logo original
    fs.copyFileSync(logoPath, faviconPath)
    fs.copyFileSync(logoPath, iconPath)
    fs.copyFileSync(logoPath, appleTouchPath)

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

    fs.writeFileSync(path.join(publicDir, "site.webmanifest"), JSON.stringify(webmanifest, null, 2))

    return NextResponse.json({
      success: true,
      message: "Archivos de favicon copiados correctamente",
      files: {
        logo: "/logo.jpg",
        favicon: "/favicon.ico",
        icon: "/icon.png",
        appleTouchIcon: "/apple-touch-icon.png",
        webmanifest: "/site.webmanifest",
      },
    })
  } catch (error) {
    console.error("Error al generar favicons:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error al generar favicons",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
