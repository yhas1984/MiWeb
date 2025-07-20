// Definimos la interfaz para las tasas
export interface ExchangeRates {
  standardRate: number
  premiumRate: number
  lastUpdated: string
}

// Valores por defecto en caso de que no se puedan cargar las tasas
const DEFAULT_RATES: ExchangeRates = {
  standardRate: 75,
  premiumRate: 76,
  lastUpdated: new Date().toISOString(),
}

// Función para obtener las tasas actuales (primero de localStorage, luego del servidor)
export function getCurrentRates(): ExchangeRates {
  // Si estamos en el servidor, devolvemos los valores por defecto
  if (typeof window === "undefined") {
    return DEFAULT_RATES
  }

  try {
    // Intentar obtener las tasas de localStorage
    const storedRates = localStorage.getItem("tuenvioexpress_rates")
    if (storedRates) {
      const parsedRates = JSON.parse(storedRates)

      // Verificar que los valores son válidos
      if (
        parsedRates &&
        typeof parsedRates.standardRate === "number" &&
        parsedRates.standardRate > 0 &&
        typeof parsedRates.premiumRate === "number" &&
        parsedRates.premiumRate > 0 &&
        parsedRates.lastUpdated
      ) {
        return {
          standardRate: parsedRates.standardRate,
          premiumRate: parsedRates.premiumRate,
          lastUpdated: parsedRates.lastUpdated,
        }
      }
    }
  } catch (error) {
    console.error("Error al leer tasas de localStorage:", error)
  }

  // Si no hay tasas en localStorage o son inválidas, devolver valores por defecto
  return DEFAULT_RATES
}

// Función para actualizar las tasas en localStorage
export function updateRatesInLocalStorage(rates: ExchangeRates): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    localStorage.setItem("tuenvioexpress_rates", JSON.stringify(rates))

    // Disparar un evento para notificar a los componentes que las tasas se han actualizado
    const event = new CustomEvent("ratesUpdated", { detail: rates })
    window.dispatchEvent(event)
  } catch (error) {
    console.error("Error al guardar tasas en localStorage:", error)
  }
}

// Función para cargar las tasas desde el servidor
export async function fetchRatesFromServer(): Promise<ExchangeRates> {
  try {
    const response = await fetch("/api/exchange-rate", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache, no-store",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Error al obtener tasas: ${response.status}`)
    }

    const data = await response.json()

    // Verificar que los valores son válidos
    if (
      data &&
      typeof data.standardRate === "number" &&
      data.standardRate > 0 &&
      typeof data.premiumRate === "number" &&
      data.premiumRate > 0
    ) {
      const rates: ExchangeRates = {
        standardRate: data.standardRate,
        premiumRate: data.premiumRate,
        lastUpdated: data.lastUpdated || new Date().toISOString(),
      }

      // Actualizar localStorage con las nuevas tasas
      updateRatesInLocalStorage(rates)

      return rates
    }

    throw new Error("Formato de tasas inválido")
  } catch (error) {
    console.error("Error al obtener tasas del servidor:", error)

    // En caso de error, devolver las tasas actuales de localStorage
    return getCurrentRates()
  }
}
