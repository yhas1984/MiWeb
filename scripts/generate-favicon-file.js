const fs = require("fs")
const path = require("path")
const { createCanvas, loadImage } = require("canvas")

// Logo URL - necesitarás descargar esta imagen primero
const logoPath = path.join(__dirname, "../public/logo.jpg")
const outputPath = path.join(__dirname, "../public")

async function generateFavicon() {
  try {
    // Verificar si existe el logo
    if (!fs.existsSync(logoPath)) {
      console.error("El archivo logo.jpg no existe en la carpeta public")
      console.log("Intentando usar la URL directamente...")

      // Intentar descargar el logo si no existe localmente
      const logoUrl =
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-03-05%20at%2015.49.43-uEHU6vvrZTFLABzyO55Lhcb201Bdkx.jpeg"

      // Crear directorio public si no existe
      if (!fs.existsSync(path.join(__dirname, "../public"))) {
        fs.mkdirSync(path.join(__dirname, "../public"), { recursive: true })
      }

      // Descargar el logo
      const response = await fetch(logoUrl)
      const buffer = await response.arrayBuffer()
      fs.writeFileSync(logoPath, Buffer.from(buffer))

      console.log("Logo descargado correctamente")
    }

    // Cargar la imagen
    const img = await loadImage(logoPath)

    // Tamaños de favicon a generar
    const sizes = [16, 32, 48, 64, 128, 256]

    // Crear directorio icons si no existe
    const iconsDir = path.join(outputPath, "icons")
    if (!fs.existsSync(iconsDir)) {
      fs.mkdirSync(iconsDir, { recursive: true })
    }

    for (const size of sizes) {
      // Crear canvas del tamaño adecuado
      const canvas = createCanvas(size, size)
      const ctx = canvas.getContext("2d")

      // Calcular el recorte cuadrado
      const imgSize = Math.min(img.width, img.height)
      const offsetX = (img.width - imgSize) / 2
      const offsetY = (img.height - imgSize) / 2

      // Dibujar la imagen recortada a un cuadrado
      ctx.drawImage(img, offsetX, offsetY, imgSize, imgSize, 0, 0, size, size)

      // Aplicar máscara circular
      ctx.globalCompositeOperation = "destination-in"
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.fill()

      // Restablecer operación de composición
      ctx.globalCompositeOperation = "source-over"

      // Guardar como PNG
      const buffer = canvas.toBuffer("image/png")

      // Guardar archivo
      fs.writeFileSync(path.join(iconsDir, `favicon-${size}x${size}.png`), buffer)

      // Guardar archivos especiales
      if (size === 32) {
        // El favicon.ico principal (32x32)
        fs.writeFileSync(path.join(outputPath, "favicon.ico"), buffer)
        fs.writeFileSync(path.join(outputPath, "icon.png"), buffer)
      } else if (size === 180 || size === 256) {
        // Apple touch icon (usar el más grande disponible)
        fs.writeFileSync(path.join(outputPath, "apple-icon.png"), buffer)
      }
    }

    // Crear el archivo site.webmanifest si no existe
    const webmanifestPath = path.join(outputPath, "site.webmanifest")
    if (!fs.existsSync(webmanifestPath)) {
      const webmanifest = {
        name: "Tu Envio Express",
        short_name: "Tu Envio Express",
        icons: [
          {
            src: "/icons/favicon-16x16.png",
            sizes: "16x16",
            type: "image/png",
          },
          {
            src: "/icons/favicon-32x32.png",
            sizes: "32x32",
            type: "image/png",
          },
          {
            src: "/icons/favicon-48x48.png",
            sizes: "48x48",
            type: "image/png",
          },
          {
            src: "/icons/favicon-128x128.png",
            sizes: "128x128",
            type: "image/png",
          },
          {
            src: "/icons/favicon-256x256.png",
            sizes: "256x256",
            type: "image/png",
          },
        ],
        theme_color: "#f59e0b",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
      }

      fs.writeFileSync(webmanifestPath, JSON.stringify(webmanifest, null, 2))
    }

    console.log("Favicons generados correctamente en:")
    console.log(`- ${path.join(outputPath, "favicon.ico")}`)
    console.log(`- ${path.join(outputPath, "icon.png")}`)
    console.log(`- ${path.join(outputPath, "apple-icon.png")}`)
    console.log(`- ${path.join(outputPath, "site.webmanifest")}`)
    console.log(`- ${iconsDir}/ (varios tamaños)`)
  } catch (error) {
    console.error("Error al generar favicons:", error)
  }
}

generateFavicon()
