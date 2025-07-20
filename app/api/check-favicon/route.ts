import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
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

    // Verificar si los archivos existen
    const status = faviconPaths.map((filePath) => {
      const fullPath = path.join(process.cwd(), "public", filePath.replace(/^\//, ""))
      return {
        path: filePath,
        exists: fs.existsSync(fullPath),
      }
    })

    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error("Error al verificar favicons:", error)
    return NextResponse.json({ success: false, message: "Error al verificar favicons" }, { status: 500 })
  }
}
