const fs = require("fs")
const path = require("path")

// Rutas de los archivos de favicon
const faviconPaths = [
  "public/favicon.ico",
  "public/icon.png",
  "public/apple-icon.png",
  "public/site.webmanifest",
  "public/icons/favicon-16x16.png",
  "public/icons/favicon-32x32.png",
  "public/icons/favicon-48x48.png",
  "public/icons/favicon-64x64.png",
  "public/icons/favicon-128x128.png",
  "public/icons/favicon-256x256.png",
]

// Verificar si los archivos existen
const missingFiles = faviconPaths.filter((filePath) => !fs.existsSync(path.resolve(process.cwd(), filePath)))

if (missingFiles.length > 0) {
  console.log("Faltan los siguientes archivos de favicon:")
  missingFiles.forEach((file) => console.log(`- ${file}`))
  console.log("\nPor favor, ejecuta el script de generación de favicon:")
  console.log("node scripts/generate-favicon-file.js")
} else {
  console.log("Todos los archivos de favicon están presentes.")
}
