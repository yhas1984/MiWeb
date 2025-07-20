// Función para obtener las tasas iniciales para SSR
export async function getInitialRates() {
  // Valores predeterminados que siempre se devolverán para el renderizado del servidor
  const defaultRates = {
    standardRate: 72,
    premiumRate: 73,
    lastUpdated: new Date().toISOString(),
  }

  // En el entorno de servidor, simplemente devolvemos los valores predeterminados
  // para evitar problemas de red o API durante el renderizado del servidor
  if (typeof window === "undefined") {
    console.log("Renderizando en servidor, usando tasas predeterminadas")
    return defaultRates
  }

  // El siguiente código solo se ejecutará en el cliente
  try {
    const baseUrl = window.location.origin
    console.log(`Intentando obtener tasas desde: ${baseUrl}/api/exchange-rate`)

    const response = await fetch(`${baseUrl}/api/exchange-rate`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      console.error(`Error de respuesta: ${response.status} ${response.statusText}`)
      return defaultRates
    }

    const data = await response.json()
    console.log("Tasas obtenidas del servidor:", data)

    return {
      standardRate: Number(data.standardRate) || defaultRates.standardRate,
      premiumRate: Number(data.premiumRate) || defaultRates.premiumRate,
      lastUpdated: data.lastUpdated || defaultRates.lastUpdated,
    }
  } catch (error) {
    console.error("Error al obtener tasas iniciales:", error)
    return defaultRates
  }
}
