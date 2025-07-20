import { type NextRequest, NextResponse } from "next/server"
import { getCurrentRates } from "@/lib/exchange-rate-service"

// Definimos la interfaz para los mensajes
interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

export async function POST(request: NextRequest) {
  try {
    // Asegurarse de que el cuerpo de la solicitud es válido
    let requestBody
    try {
      requestBody = await request.json()
    } catch (parseError) {
      console.error("Error al parsear el cuerpo de la solicitud:", parseError)
      return NextResponse.json(
        { error: "Formato de solicitud inválido", details: "El cuerpo de la solicitud no es un JSON válido" },
        { status: 400 },
      )
    }

    const { messages } = requestBody as { messages: Message[] }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Formato de solicitud inválido", details: "El campo 'messages' es requerido y debe ser un array" },
        { status: 400 },
      )
    }

    // Obtenemos las tasas actuales usando el servicio
    const rates = getCurrentRates()
    const standardRate = rates.standardRate
    const premiumRate = rates.premiumRate

    // Registrar las tasas para depuración
    console.log(`[Fallback] Usando tasas en el chat: Estándar=${standardRate}, Premium=${premiumRate}`)

    // Obtener el último mensaje del usuario
    const lastUserMessage = [...messages].reverse().find((msg) => msg.role === "user")?.content || ""

    // Respuestas predefinidas basadas en palabras clave
    let responseText = ""

    if (
      lastUserMessage.toLowerCase().includes("tasa") ||
      lastUserMessage.toLowerCase().includes("cambio") ||
      lastUserMessage.toLowerCase().includes("euro") ||
      lastUserMessage.toLowerCase().includes("bolivar")
    ) {
      responseText = `Actualmente manejamos dos tipos de tasas para el cambio de Euros a Bolívares:

💰 Tasa estándar (usuarios no registrados): 1 EUR = ${standardRate} VES
🔴 Tasa premium (usuarios registrados): 1 EUR = ${premiumRate} VES

Te recomendamos registrarte para acceder a nuestra tasa premium más ventajosa.`
    } else if (
      lastUserMessage.toLowerCase().includes("registro") ||
      lastUserMessage.toLowerCase().includes("registrar")
    ) {
      responseText = `Para registrarte y acceder a nuestra tasa premium, simplemente:

1. Ve a la sección "Tasa del Día" en nuestra página principal
2. Ingresa tu correo electrónico en el campo "¿Ya estás registrado?"
3. Sigue las instrucciones para verificar tu cuenta

Una vez verificado, tendrás acceso a nuestra tasa premium de ${premiumRate} VES por 1 EUR.`
    } else if (
      lastUserMessage.toLowerCase().includes("contacto") ||
      lastUserMessage.toLowerCase().includes("correo") ||
      lastUserMessage.toLowerCase().includes("teléfono") ||
      lastUserMessage.toLowerCase().includes("whatsapp")
    ) {
      responseText = `Puedes contactarnos a través de:

📧 Email: contacto@tuenvioexpress.es
📱 WhatsApp: +44 7723 456789

Nuestro equipo estará encantado de ayudarte con cualquier consulta.`
    } else if (
      lastUserMessage.toLowerCase().includes("envío") ||
      lastUserMessage.toLowerCase().includes("paquete") ||
      lastUserMessage.toLowerCase().includes("enviar")
    ) {
      responseText = `Es importante aclarar que Tu Envio Express, a pesar de su nombre, NO se dedica al envío de paquetes o mercancías.

Somos una empresa especializada ÚNICAMENTE en servicios de cambio de divisas entre Euros (EUR) y Bolívares venezolanos (VES).

Si necesitas información sobre nuestras tasas de cambio, estaré encantado de ayudarte.`
    } else {
      // Respuesta genérica
      responseText = `Gracias por tu mensaje. Soy el asistente virtual de Tu Envio Express, especializada en cambio de divisas entre Euros y Bolívares venezolanos.

Actualmente ofrecemos:
- Tasa estándar: 1 EUR = ${standardRate} VES
- Tasa premium: 1 EUR = ${premiumRate} VES

¿En qué más puedo ayudarte hoy?`
    }

    // Devolver la respuesta en el formato esperado
    return NextResponse.json({
      text: responseText,
      message: responseText,
      choices: [
        {
          message: {
            content: responseText,
            role: "assistant",
          },
        },
      ],
    })
  } catch (error) {
    console.error("[Fallback] Error general en el chat:", error)
    return NextResponse.json(
      {
        error: "Error al procesar el mensaje",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
