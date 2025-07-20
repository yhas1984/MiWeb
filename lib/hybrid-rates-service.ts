import fs from "fs"
import path from "path"

// Ruta al archivo de tasas
const RATES_FILE_PATH = path.join(process.cwd(), "data", "exchange-rates.json")

// Valores por defecto
const DEFAULT_RATES = {
  standardRate: 72.5,
  premiumRate: 73.5,
  lastUpdated: new Date().toISOString(),
}

/**
 * Asegura que el directorio para el archivo de tasas existe
 */
export const ensureDirectoryExists = () => {
  try {
    const dirPath = path.dirname(RATES_FILE_PATH)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
      console.log(`Directorio creado: ${dirPath}`)
    }
    return true
  } catch (error) {
    console.error("Error al crear directorio:", error)
    return false
  }
}

/**
 * Guarda las tasas en el archivo (sin lanzar errores)
 */
export const saveRatesSafely = (rates: { standardRate: number; premiumRate: number }) => {
  try {
    // Asegurar que el directorio existe
    ensureDirectoryExists()

    // Preparar datos para guardar
    const dataToSave = {
      standardRate: rates.standardRate,
      premiumRate: rates.premiumRate,
      lastUpdated: new Date().toISOString(),
    }

    // Escribir directamente en el archivo
    fs.writeFileSync(RATES_FILE_PATH, JSON.stringify(dataToSave, null, 2))
    console.log("Tasas guardadas correctamente en archivo:", dataToSave)
    return true
  } catch (error) {
    console.error("Error al guardar tasas en archivo:", error)
    return false
  }
}

/**
 * Valida que las tasas sean correctas
 */
export const validateRates = (standardRate: any, premiumRate: any) => {
  // Convertir a números y validar
  const standardRateNum = Number(standardRate)
  const premiumRateNum = Number(premiumRate)

  if (isNaN(standardRateNum) || isNaN(premiumRateNum)) {
    return {
      valid: false,
      message: "Las tasas deben ser números válidos",
    }
  }

  if (standardRateNum <= 0 || premiumRateNum <= 0) {
    return {
      valid: false,
      message: "Las tasas deben ser mayores que cero",
    }
  }

  if (premiumRateNum <= standardRateNum) {
    return {
      valid: false,
      message: "La tasa premium debe ser mayor que la tasa estándar",
    }
  }

  return {
    valid: true,
    message: "Tasas válidas",
    rates: {
      standardRate: standardRateNum,
      premiumRate: premiumRateNum,
    },
  }
}
