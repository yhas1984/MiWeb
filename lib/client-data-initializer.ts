"use client"

// Función para inicializar los datos en el cliente
export function initializeClientData(data: {
  standardRate: number
  premiumRate: number
  lastUpdated: string
}) {
  // Solo ejecutar en el cliente
  if (typeof window === "undefined") return

  try {
    // Guardar en localStorage para que esté disponible inmediatamente
    localStorage.setItem(
      "tuenvioexpress_rates",
      JSON.stringify({
        standardRate: data.standardRate,
        premiumRate: data.premiumRate,
        lastUpdated: data.lastUpdated,
      }),
    )

    // Disparar evento para notificar a los componentes
    const event = new CustomEvent("ratesUpdated", {
      detail: {
        standardRate: data.standardRate,
        premiumRate: data.premiumRate,
        lastUpdated: data.lastUpdated,
      },
    })
    window.dispatchEvent(event)
  } catch (error) {
    console.error("Error al inicializar datos del cliente:", error)
  }
}
