import nodemailer from "nodemailer"
import { addNotificationToSupabase } from "@/lib/notification-service-supabase"

// Añadir al inicio del archivo, después de las importaciones
const LOG_PREFIX = "[EMAIL-SERVICE]"
console.log(`${LOG_PREFIX} Módulo inicializado - ${new Date().toISOString()}`)

// Configuración del transporte de email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number.parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

// URL del logo (actualizada para asegurar que funcione)
const LOGO_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-03-05%20at%2015.49.43-uEHU6vvrZTFLABzyO55Lhcb201Bdkx.jpeg"

// Modificar la función sendVerificationEmail para mejorar la prevención de duplicados
export async function sendVerificationEmail(
  to: string,
  name: string,
  code: string,
  customMessage?: string,
): Promise<boolean> {
  const emailId = `email-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  console.log(`${LOG_PREFIX} [${emailId}] Solicitud de envío de email a ${to} - ${new Date().toISOString()}`)

  try {
    // Verificar si ya se ha enviado un email recientemente a este destinatario
    // para evitar duplicados (solo para emails de verificación, no para notificaciones)
    if (code) {
      const emailCacheKey = `email_sent_${to.toLowerCase()}_${code}`
      console.log(`${LOG_PREFIX} [${emailId}] Verificando duplicados con clave: ${emailCacheKey}`)
      console.log(`${LOG_PREFIX} [${emailId}] ¿Existe en caché global? ${(global as any)[emailCacheKey] ? "SÍ" : "NO"}`)

      if ((global as any)[emailCacheKey]) {
        console.log(
          `${LOG_PREFIX} [${emailId}] DUPLICADO DETECTADO: Evitando envío duplicado a ${to} con código ${code}`,
        )
        return true // Simular éxito para evitar reintentos
      }

      // Marcar este email como enviado ANTES de enviarlo realmente
      // para evitar condiciones de carrera
      console.log(`${LOG_PREFIX} [${emailId}] Marcando email como enviado en caché global`)
      ;(global as any)[emailCacheKey] = {
        timestamp: new Date().toISOString(),
        emailId,
      }

      // Establecer un temporizador para eliminar la marca después de 5 minutos
      setTimeout(
        () => {
          console.log(`${LOG_PREFIX} [${emailId}] Eliminando marca de caché para ${emailCacheKey}`)
          delete (global as any)[emailCacheKey]
        },
        5 * 60 * 1000,
      )
    }

    // Determinar si es una notificación administrativa
    const isAdminNotification = customMessage && customMessage.includes("ADMIN-NOTIFY")
    console.log(
      `${LOG_PREFIX} [${emailId}] Tipo de email: ${isAdminNotification ? "Notificación Admin" : "Verificación"}`,
    )

    // Preparar el asunto del correo
    const subject = isAdminNotification
      ? "Notificación: Usuario verificado en Tu Envio Express"
      : "Verifica tu cuenta en Tu Envio Express"

    console.log(`${LOG_PREFIX} [${emailId}] Enviando email a través de nodemailer`)

    // MEJORA: Añadir un retraso aleatorio para evitar envíos simultáneos
    const randomDelay = Math.floor(Math.random() * 500) // 0-500ms
    await new Promise((resolve) => setTimeout(resolve, randomDelay))

    const info = await transporter.sendMail({
      from: `"Tu Envio Express" <${process.env.EMAIL_USER}>`,
      to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${LOGO_URL}" alt="Tu Envio Express" style="max-width: 150px; height: auto;">
          </div>
          <h2 style="color: #f59e0b; text-align: center;">${isAdminNotification ? "Notificación Administrativa" : "Verificación de Cuenta"}</h2>
          <p>Hola ${name},</p>
          ${
            customMessage
              ? `<p>${customMessage.replace("ADMIN-NOTIFY:", "")}</p>`
              : `
          <p>Gracias por registrarte en Tu Envio Express. Para verificar tu cuenta y acceder a nuestra tasa preferencial, por favor utiliza el siguiente código:</p>
          <div style="background-color: #f8fafc; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px;">
            ${code}
          </div>
          <p>Este código expirará en 30 minutos por razones de seguridad.</p>
          <p>Si no has solicitado esta verificación, puedes ignorar este mensaje.</p>
          `
          }
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #6b7280; font-size: 14px;">
            <p>© ${new Date().getFullYear()} Tu Envio Express. Todos los derechos reservados.</p>
          </div>
        </div>
      `,
    })

    console.log(`${LOG_PREFIX} [${emailId}] Email enviado exitosamente: ${info.messageId}`)

    // Si es un mensaje de notificación para el administrador, no duplicar la notificación interna
    if (!isAdminNotification && to !== "contacto@tuenvioexpress.es") {
      console.log(`${LOG_PREFIX} [${emailId}] Creando notificación interna para ${to}`)
      try {
        await addNotificationToSupabase({
          type: "verification",
          title: "Código de verificación enviado",
          message: `Se ha enviado un código de verificación a ${name} (${to}).`,
          email: to,
        })
      } catch (notificationError) {
        console.error(`${LOG_PREFIX} [${emailId}] Error al crear notificación:`, notificationError)
        // No fallamos si hay error en la notificación
      }
    }

    return true
  } catch (error) {
    console.error(`${LOG_PREFIX} [${emailId}] Error al enviar email:`, error)
    return false
  }
}