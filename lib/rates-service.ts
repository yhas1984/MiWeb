export const RATES_STORAGE_KEY = "tuenvioexpress_rates"

export interface RatesData {
  standardRate: number
  premiumRate: number
  lastUpdated: string
}

// Función para obtener las tasas actuales
export function getCurrentRates(): RatesData {
  try {
    if (typeof window !== "undefined") {
      const savedRates = localStorage.getItem(RATES_STORAGE_KEY)
      if (savedRates) {
        const rates = JSON.parse(savedRates)

        // Validar que los valores son números válidos
        const standardRate = Number(rates.standardRate)
        const premiumRate = Number(rates.premiumRate)

        if (!isNaN(standardRate) && standardRate > 0 && !isNaN(premiumRate) && premiumRate > 0) {
          return {
            standardRate,
            premiumRate,
            lastUpdated: rates.lastUpdated || new Date().toISOString(),
          }
        }
      }
    }
  } catch (error) {
    console.error("Error al obtener tasas desde localStorage:", error)
  }

  // Valores por defecto si no hay tasas guardadas o son inválidas
  return {
    standardRate: 72.5,
    premiumRate: 73.5,
    lastUpdated: new Date().toISOString(),
  }
}

// Función para guardar las tasas
export function saveRates(rates: RatesData): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(rates))
      console.log("Tasas guardadas en localStorage:", rates)

      // Emitir evento para que otros componentes se actualicen
      const event = new CustomEvent("ratesUpdated", {
        detail: rates,
      })
      window.dispatchEvent(event)
    }
  } catch (error) {
    console.error("Error al guardar las tasas en localStorage:", error)
  }
}

// Función para formatear la fecha
export function formatDate(dateString: string): string {
  try {
    if (!dateString) return "No disponible"

    // Verificar si estamos en el cliente
    if (typeof window === "undefined") {
      return "Actualizado recientemente"
    }

    // Verificar si la fecha es "2023-01-01T00:00:00Z" o similar (fecha por defecto)
    if (dateString.includes("2023-01-01")) {
      // Usar la fecha actual en su lugar
      const now = new Date()
      return now.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    }

    const date = new Date(dateString)

    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      // Si la fecha no es válida, usar la fecha actual
      const now = new Date()
      return now.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    }

    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch (error) {
    console.error("Error al formatear fecha:", error)
    // En caso de error, devolver la fecha actual formateada
    const now = new Date()
    return now.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }
}
