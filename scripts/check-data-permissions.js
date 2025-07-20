/**
 * Script para verificar y corregir los permisos del directorio de datos
 * Ejecutar con: node scripts/check-data-permissions.js
 */

const fs = require("fs")
const path = require("path")

// Ruta al directorio de datos
const DATA_DIR = path.join(process.cwd(), "data")
const RATES_FILE_PATH = path.join(DATA_DIR, "exchange-rate.json")

// Valores por defecto para el archivo de tasas
const DEFAULT_RATES = {
  standardRate: 72.5,
  premiumRate: 73.5,
  lastUpdated: new Date().toISOString(),
}

console.log("Verificando directorio de datos...")

// Verificar si el directorio existe
if (!fs.existsSync(DATA_DIR)) {
  console.log(`El directorio ${DATA_DIR} no existe. Creando...`)
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    console.log(`Directorio ${DATA_DIR} creado correctamente.`)
  } catch (error) {
    console.error(`Error al crear el directorio ${DATA_DIR}:`, error)
    process.exit(1)
  }
}

// Verificar permisos de escritura
console.log("Verificando permisos de escritura...")
const testFile = path.join(DATA_DIR, ".test-permissions")

try {
  // Intentar escribir un archivo de prueba
  fs.writeFileSync(testFile, "test")
  console.log("Permisos de escritura verificados correctamente.")

  // Eliminar el archivo de prueba
  fs.unlinkSync(testFile)
} catch (error) {
  console.error("Error: No se puede escribir en el directorio de datos:", error)
  console.log(
    "Por favor, asegúrate de que el usuario que ejecuta la aplicación tiene permisos de escritura en el directorio.",
  )
  process.exit(1)
}

// Verificar si el archivo de tasas existe
console.log("Verificando archivo de tasas...")
if (!fs.existsSync(RATES_FILE_PATH)) {
  console.log(`El archivo ${RATES_FILE_PATH} no existe. Creando con valores predeterminados...`)
  try {
    fs.writeFileSync(RATES_FILE_PATH, JSON.stringify(DEFAULT_RATES, null, 2))
    console.log(`Archivo ${RATES_FILE_PATH} creado correctamente.`)
  } catch (error) {
    console.error(`Error al crear el archivo ${RATES_FILE_PATH}:`, error)
    process.exit(1)
  }
} else {
  console.log(`El archivo ${RATES_FILE_PATH} existe.`)

  // Verificar si el archivo es válido
  try {
    const data = fs.readFileSync(RATES_FILE_PATH, "utf8")
    const rates = JSON.parse(data)

    if (
      !rates ||
      typeof rates.standardRate !== "number" ||
      typeof rates.premiumRate !== "number" ||
      rates.standardRate <= 0 ||
      rates.premiumRate <= 0
    ) {
      console.log("El archivo de tasas contiene datos inválidos. Corrigiendo...")
      fs.writeFileSync(RATES_FILE_PATH, JSON.stringify(DEFAULT_RATES, null, 2))
      console.log("Archivo de tasas corregido con valores predeterminados.")
    } else {
      console.log("El archivo de tasas contiene datos válidos.")
    }
  } catch (error) {
    console.error("Error al leer o validar el archivo de tasas:", error)
    console.log("Corrigiendo archivo de tasas...")

    try {
      fs.writeFileSync(RATES_FILE_PATH, JSON.stringify(DEFAULT_RATES, null, 2))
      console.log("Archivo de tasas corregido con valores predeterminados.")
    } catch (writeError) {
      console.error("Error al corregir el archivo de tasas:", writeError)
      process.exit(1)
    }
  }
}

console.log("Verificación completada. Todo está correcto.")
