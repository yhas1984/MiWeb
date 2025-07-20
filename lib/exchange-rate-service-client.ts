/**
 * Servicio para gestionar las tasas de cambio (lado del cliente)
 */

// Clave para almacenar las tasas en localStorage
const RATES_STORAGE_KEY = "tuenvioexpress_rates"

// Valores por defecto
const DEFAULT_RATES = {
  standardRate: 92,
  premiumRate: 93,
  lastUpdated: new Date().toISOString(),
}

/**
 * Obtiene las tasas actuales del localStorage
 */
export function getRatesFromStorage() {
  try {
    const storedRates = localStorage.getItem(RATES_STORAGE_KEY)
    if (storedRates) {
      const rates = JSON.parse(storedRates)

      // Validar que los datos son correctos
      if (
        !rates ||
        typeof rates.standardRate !== "number" ||
        typeof rates.premiumRate !== "number" ||
        rates.standardRate <= 0 ||
        rates.premiumRate <= 0
      ) {
        console.error("Datos de tasas inválidos en localStorage, usando valores predeterminados")
        return DEFAULT_RATES
      }

      return {
        standardRate: rates.standardRate,
        premiumRate: rates.premiumRate,
        lastUpdated: rates.lastUpdated || new Date().toISOString(),
      }
    }
    return DEFAULT_RATES
  } catch (error) {
    console.error("Error al leer tasas de localStorage:", error)
    return DEFAULT_RATES
  }
}

/**
 * Guarda las tasas en localStorage
 */
export function saveRatesToStorage(rates: { standardRate: number; premiumRate: number; lastUpdated: string }) {
  try {
    localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(rates))
    console.log("Tasas guardadas en localStorage:", rates)

    // Disparar evento para notificar a otros componentes
    const event = new CustomEvent("ratesUpdated", { detail: rates })
    window.dispatchEvent(event)

    return true
  } catch (error) {
    console.error("Error al guardar tasas en localStorage:", error)
    return false
  }
}

/**
 * Obtiene las tasas actuales del servidor
 */
export async function fetchRatesFromServer(forceUpdate = false) {
  try {
    const response = await fetch("/api/exchange-rate", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Cache-Control": forceUpdate ? "no-cache, no-store" : "default",
      },
      cache: forceUpdate ? "no-store" : "default",
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`)
    }

    const data = await response.json()
    console.log("Tasas recibidas del servidor:", data)

    // Convertir a números para asegurar el formato correcto
    const standardRateValue = Number(data.standardRate)
    const premiumRateValue = Number(data.premiumRate)

    // Validar que los valores son válidos
    if (isNaN(standardRateValue) || isNaN(premiumRateValue) || standardRateValue <= 0 || premiumRateValue <= 0) {
      console.error("Valores de tasas inválidos recibidos del servidor")
      return getRatesFromStorage() // Usar valores de localStorage como respaldo
    }

    // Crear objeto de tasas
    const rates = {
      standardRate: standardRateValue,
      premiumRate: premiumRateValue,
      lastUpdated: data.lastUpdated || new Date().toISOString(),
    }

    // Guardar en localStorage
    saveRatesToStorage(rates)

    return rates
  } catch (error) {
    console.error("Error al obtener tasas del servidor:", error)
    return getRatesFromStorage() // Usar valores de localStorage como respaldo
  }
}

/**
 * Actualiza las tasas en el servidor
 */
export async function updateRates(standardRate: number, premiumRate: number, token: string) {
  try {
    console.log("Actualizando tasas:", { standardRate, premiumRate })

    const response = await fetch("/api/admin/update-rates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        standardRate,
        premiumRate,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `Error: ${response.status}`)
    }

    console.log("Respuesta de actualización:", data)

    if (data.success) {
      // Actualizar localStorage con las nuevas tasas
      const rates = {
        standardRate: Number(data.standardRate),
        premiumRate: Number(data.premiumRate),
        lastUpdated: data.lastUpdated,
      }

      saveRatesToStorage(rates)

      return {
        success: true,
        standardRate: rates.standardRate,
        premiumRate: rates.premiumRate,
        lastUpdated: rates.lastUpdated,
      }
    } else {
      throw new Error(data.message || "No se pudo actualizar la tasa")
    }
  } catch (error) {
    console.error("Error al actualizar tasas:", error)
    throw error
  }
}

/**
 * Obtiene las tasas actuales (primero de localStorage, luego intenta actualizar del servidor)
 */
export function getCurrentRates() {
  // Primero obtener de localStorage para respuesta inmediata
  return getRatesFromStorage()
}
