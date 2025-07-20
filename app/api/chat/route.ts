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
    console.log(`Usando tasas en el chat: Estándar=${standardRate}, Premium=${premiumRate}`)

    // Preparamos el historial de mensajes para la API
    const formattedMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    // Añadimos un mensaje de sistema para dar contexto al modelo
    const systemMessage = {
      role: "system",
      content: `Eres el asistente virtual de Tu Envio Express, una empresa que ofrece servicios de cambio de divisas entre Euros (EUR) y Bolívares (VES).

Información importante:
- La empresa se llama Tu Envio Express (VYE PARTNERS LLP)
- Está ubicada en Londres, Reino Unido
- SOLO ofrece servicios de cambio de Euros a Bolívares venezolanos
- NO envía paquetes ni realiza envíos físicos de ningún tipo, a pesar del nombre "Tu Envio Express", la empresa SOLO se dedica al cambio de divisas
- El correo de contacto es contacto@tuenvioexpress.es
- Los usuarios pueden registrarse a través de un formulario de Google para obtener una tasa preferencial
- Ofrecemos dos tasas: 
 * Tasa estándar para usuarios no registrados: 1 EUR = ${standardRate} VES
 * Tasa premium para usuarios registrados: 1 EUR = ${premiumRate} VES
- Las tasas se actualizan regularmente en nuestra página web

Cuando te pregunten por la tasa actual, proporciona SIEMPRE ambas tasas con sus valores numéricos exactos (${standardRate} y ${premiumRate}).

Responde de manera amable, profesional y concisa. Si te preguntan sobre envío de paquetes o servicios que no sean cambio de divisas, aclara ENFÁTICAMENTE que la empresa SOLO se dedica al cambio de Euros a Bolívares, a pesar de su nombre. Si no sabes algo específico sobre la empresa, sugiere que contacten directamente por correo o WhatsApp.`,
    }

    // Aseguramos que el mensaje de sistema esté al principio
    const allMessages = [systemMessage, ...formattedMessages]

    try {
      // Aumentamos el timeout para evitar errores de FUNCTION_INVOCATION_TIMEOUT
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 25000) // 25 segundos de timeout

      // Realizamos la llamada a la API de OpenRouter con manejo mejorado de errores
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://www.tuenvioexpress.es",
          "X-Title": "Tu Envio Express Chat",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-r1:free",
          messages: allMessages,
          max_tokens: 500,
          temperature: 0.7,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        // Intentar obtener el texto de error
        let errorText = ""
        try {
          errorText = await response.text()
        } catch (e) {
          errorText = `Error ${response.status}`
        }

        // Intentar parsear como JSON si es posible
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          errorData = { error: errorText }
        }

        console.error("Error en OpenRouter API:", errorData)

        // Respuesta de error estructurada
        return NextResponse.json(
          {
            error: "Error en la API de chat",
            details: `Error ${response.status}: ${errorData.error || errorText}`,
          },
          { status: response.status },
        )
      }

      // Manejar la respuesta con cuidado
      const responseText = await response.text()
      let data

      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("Error al parsear la respuesta JSON:", parseError)
        console.error("Respuesta recibida:", responseText.substring(0, 200))
        return NextResponse.json(
          {
            error: "Error al parsear la respuesta",
            details: "La respuesta de la API no es un JSON válido",
          },
          { status: 500 },
        )
      }

      console.log("Estructura de respuesta recibida:", data)

      // Verificar que la estructura de la respuesta es la esperada y extraer el mensaje
      let assistantMessage = ""

      if (data.choices && data.choices[0]?.message?.content) {
        assistantMessage = data.choices[0].message.content
      } else if (data.choices && data.choices[0]?.message) {
        // Si el mensaje está en un formato diferente, intentar extraerlo
        console.log("Formato de mensaje alternativo detectado:", data.choices[0].message)
        assistantMessage =
          typeof data.choices[0].message === "string"
            ? data.choices[0].message
            : JSON.stringify(data.choices[0].message)
      } else {
        console.error("Estructura de respuesta inesperada:", data)
        return NextResponse.json(
          {
            error: "Respuesta inesperada",
            details: "La estructura de la respuesta no es la esperada",
          },
          { status: 500 },
        )
      }

      // Modificar esta línea para que coincida con lo que espera el frontend
      return NextResponse.json({
        text: assistantMessage,
        message: assistantMessage,
        // También incluimos la estructura original para compatibilidad
        choices: data.choices,
      })
    } catch (apiError) {
      console.error("Error al llamar a OpenRouter API:", apiError)

      // Determinar si es un error de timeout
      const isTimeoutError =
        apiError.name === "AbortError" || (apiError instanceof Error && apiError.message.includes("timeout"))

      const errorMessage = isTimeoutError
        ? "La solicitud ha excedido el tiempo de espera. Por favor, intenta de nuevo."
        : apiError instanceof Error
          ? apiError.message
          : "Error desconocido al llamar a la API externa"

      return NextResponse.json(
        {
          error: isTimeoutError ? "Timeout" : "Error al procesar el mensaje",
          details: errorMessage,
        },
        { status: isTimeoutError ? 504 : 500 },
      )
    }
  } catch (error) {
    console.error("Error general en el chat:", error)
    return NextResponse.json(
      {
        error: "Error al procesar el mensaje",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
