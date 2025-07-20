// Configuración de correo electrónico
export const EMAIL_CONFIG = {
  // Dirección de correo del administrador para recibir copias
  ADMIN_EMAIL: "contacto@tuenvioexpress.es",

  // Tiempo de expiración del código OTP en minutos
  OTP_EXPIRATION_MINUTES: 30,

  // Número máximo de intentos de verificación por día
  MAX_VERIFICATION_ATTEMPTS: 5,

  // Asunto del correo de verificación
  VERIFICATION_SUBJECT: "Verifica tu cuenta en Tu Envio Express",

  // Remitente del correo
  EMAIL_SENDER: "Tu Envio Express <noreply@tuenvioexpress.es>",

  // URL base para imágenes en correos
  BASE_URL: process.env.NEXT_PUBLIC_APP_URL || "https://www.tuenvioexpress.es",
}
