const fs = require("fs")
const path = require("path")
const https = require("https")

// Directorio para las imágenes de respaldo
const imagesDir = path.join(process.cwd(), "public", "images", "news")

// Asegurarse de que el directorio existe
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true })
  console.log(`Directorio creado: ${imagesDir}`)
}

// URLs de imágenes de respaldo
const fallbackImages = {
  "economia.jpg": "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1000&auto=format&fit=crop",
  "tipo-de-cambio.jpg": "https://images.unsplash.com/photo-1621155346337-1d19476ba7d6?q=80&w=1000&auto=format&fit=crop",
  "regulaciones.jpg": "https://images.unsplash.com/photo-1634128221889-82ed6efebfc3?q=80&w=1000&auto=format&fit=crop",
  "venezuela.jpg": "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?q=80&w=1000&auto=format&fit=crop",
}

// Descargar imágenes si no existen
Object.entries(fallbackImages).forEach(([filename, url]) => {
  const filePath = path.join(imagesDir, filename)

  if (!fs.existsSync(filePath)) {
    console.log(`Descargando ${filename} desde ${url}...`)

    const file = fs.createWriteStream(filePath)
    https
      .get(url, (response) => {
        response.pipe(file)
        file.on("finish", () => {
          file.close()
          console.log(`Imagen descargada: ${filename}`)
        })
      })
      .on("error", (err) => {
        fs.unlink(filePath)
        console.error(`Error al descargar ${filename}:`, err.message)
      })
  } else {
    console.log(`La imagen ${filename} ya existe.`)
  }
})

console.log("Proceso de configuración de imágenes de respaldo completado.")
