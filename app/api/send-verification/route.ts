import { type NextRequest, NextResponse } from "next/server"
import { generateOTP, saveOTP } from "@/services/verification-service-supabase"
import { sendVerificationEmail } from "@/services/email-service"
import { addNotificationToSupabase } from "@/lib/notification-service-supabase"

// Objetos separados para diferentes propósitos
const requestInProgress: Record<string, { timestamp: number; inProgress: boolean; requestId?: string }> = {}
const emailSentCache: Record<string, { timestamp: number }> = {}

// Añadir al inicio del archivo, después de las importaciones
const LOG_PREFIX = "[SEND-VERIFICATION]"
console.log(`${LOG_PREFIX} Módulo inicializado - ${new Date().toISOString()}`)

// Modificar la función POST para mejorar la prevención de duplicados
export async function POST(request: NextRequest) {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  console.log(`${LOG_PREFIX} [${requestId}] Solicitud recibida - ${new Date().toISOString()}`)

  try {
    const { email, name } = await request.json()
    console.log(`${LOG_PREFIX} [${requestId}] Datos recibidos: email=${email}, name=${name}`)

    if (!email) {
      console.log(`${LOG_PREFIX} [${requestId}] Error: Email requerido`)
      return NextResponse.json(
        {
          success: false,
          message: "Email es requerido",
        },
        { status: 400 },
      )
    }

    // Normalizar el email para consistencia
    const normalizedEmail = email.toLowerCase()
    console.log(`${LOG_PREFIX} [${requestId}] Email normalizado: ${normalizedEmail}`)

    // MEJORA: Usar un sistema más robusto para prevenir duplicados
    // Crear una clave única global para esta solicitud específica
    const uniqueRequestKey = `email_request_${normalizedEmail}_${new Date().toISOString().split("T")[0]}`

    // Verificar si hay una solicitud en curso para este email
    if (requestInProgress[uniqueRequestKey] && requestInProgress[uniqueRequestKey].inProgress) {
      const timeSinceLastRequest = Date.now() - requestInProgress[uniqueRequestKey].timestamp

      // Si hay una solicitud en curso que comenzó hace menos de 10 segundos, rechazar
      if (timeSinceLastRequest < 10000) {
        console.log(
          `${LOG_PREFIX} [${requestId}] Solicitud duplicada detectada para ${normalizedEmail}, hace ${timeSinceLastRequest}ms`,
        )
        return NextResponse.json({
          success: true,
          message: "Ya se está procesando una solicitud para este email. Por favor, espera unos segundos.",
        })
      }
    }

    // Marcar que estamos procesando una solicitud para este email
    requestInProgress[uniqueRequestKey] = {
      timestamp: Date.now(),
      inProgress: true,
      requestId,
    }

    // Verificar si ya se ha enviado un email recientemente a este destinatario
    const emailCacheKey = `email_sent_${normalizedEmail}_${new Date().toISOString().split("T")[0]}`

    if (emailSentCache[emailCacheKey]) {
      const timeSinceLastSend = Date.now() - emailSentCache[emailCacheKey].timestamp
      // Si se envió hace menos de 1 minuto, evitar duplicados
      if (timeSinceLastSend < 60000) {
        console.log(`${LOG_PREFIX} [${requestId}] Evitando duplicado, último envío hace ${timeSinceLastSend}ms`)

        // Liberar el bloqueo de solicitud en curso
        if (requestInProgress[uniqueRequestKey]) {
          requestInProgress[uniqueRequestKey].inProgress = false
        }

        return NextResponse.json({
          success: true,
          message: "Código de verificación enviado recientemente. Por favor, revisa tu correo.",
        })
      }
    }

    try {
      // Generar un nuevo código OTP
      const code = generateOTP()
      console.log(`${LOG_PREFIX} [${requestId}] Código generado para ${normalizedEmail}: ${code}`)

      // Guardar el código OTP en Supabase
      const saved = await saveOTP(normalizedEmail, code)
      if (!saved) {
        console.error(`${LOG_PREFIX} [${requestId}] Error al guardar el código OTP para ${normalizedEmail}`)

        // Liberar el bloqueo de solicitud en curso
        if (requestInProgress[uniqueRequestKey]) {
          requestInProgress[uniqueRequestKey].inProgress = false
        }

        return NextResponse.json(
          {
            success: false,
            message: "Error al generar nuevo código",
          },
          { status: 500 },
        )
      }

      // Marcar este email como enviado ANTES de enviarlo realmente
      emailSentCache[emailCacheKey] = {
        timestamp: Date.now(),
      }

      // Usar el nombre proporcionado o extraerlo del email
      const userName = name || email.split("@")[0]

      // Intentar enviar el email directamente - SOLO UNA VEZ
      console.log(`${LOG_PREFIX} [${requestId}] Intentando enviar email a ${normalizedEmail}`)
      const emailSent = await sendVerificationEmail(email, userName, code)
      console.log(`${LOG_PREFIX} [${requestId}] Resultado del envío de email: ${emailSent ? "ÉXITO" : "FALLO"}`)

      if (!emailSent) {
        console.error(`${LOG_PREFIX} [${requestId}] Error al enviar email a ${email}`)

        // Liberar el bloqueo de solicitud en curso
        if (requestInProgress[uniqueRequestKey]) {
          requestInProgress[uniqueRequestKey].inProgress = false
        }

        return NextResponse.json(
          {
            success: false,
            message: "Error al enviar el email de verificación",
          },
          { status: 500 },
        )
      }

      // Registrar en consola para fines de depuración
      console.log(`${LOG_PREFIX} [${requestId}] Email enviado a ${email} con código ${code}`)

      // Intentar crear notificación, pero no fallar si hay error
      try {
        await addNotificationToSupabase({
          type: "verification",
          title: "Solicitud de verificación",
          message: `El usuario ${userName} (${email}) ha solicitado un código de verificación.`,
          email,
        })
      } catch (notificationError) {
        console.error(`${LOG_PREFIX} [${requestId}] Error al crear notificación:`, notificationError)
        // No fallamos si hay error en la notificación
      }

      // Liberar el bloqueo de solicitud en curso
      if (requestInProgress[uniqueRequestKey]) {
        requestInProgress[uniqueRequestKey].inProgress = false
      }

      console.log(`${LOG_PREFIX} [${requestId}] Solicitud completada con éxito`)
      return NextResponse.json({
        success: true,
        message: "Código de verificación enviado correctamente",
        // Solo para pruebas, no incluir en producción
        testCode: process.env.VERCEL_ENV === "development" ? code : undefined,
      })
    } catch (emailError) {
      console.error(`${LOG_PREFIX} [${requestId}] Error al enviar email:`, emailError)

      // Liberar el bloqueo de solicitud en curso
      if (requestInProgress[uniqueRequestKey]) {
        requestInProgress[uniqueRequestKey].inProgress = false
      }

      return NextResponse.json(
        {
          success: false,
          message: "Error al enviar el email de verificación",
          details: emailError instanceof Error ? emailError.message : "Error desconocido",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error(`${LOG_PREFIX} [${requestId}] Error general:`, error)
    return NextResponse.json(
      {
        success: false,
        message: "Error al procesar la solicitud",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
