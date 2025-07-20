import { createServerSupabaseClient } from "@/lib/supabase-client"
import type { VerificationResult } from "@/models/user"
import { markUserAsVerified } from "@/lib/user-service-supabase"
import { addNotificationToSupabase } from "@/lib/notification-service-supabase"

// Prefijo para logs
const LOG_PREFIX = "[VERIFICATION-SERVICE-SUPABASE]"
console.log(`${LOG_PREFIX} Módulo inicializado - ${new Date().toISOString()}`)

// Tiempo de expiración del código OTP en minutos
const OTP_EXPIRATION_MINUTES = 30

// Declaración global para la caché y bloqueos
declare global {
  var verificationCodes: Record<string, {
    code: string;
    expires: Date;
    saveId: string;
  }>;
  var saveOTPLocks: Record<string, boolean>;
}

/**
 * Genera un código OTP aleatorio de 6 dígitos
 */
export function generateOTP(): string {
  const otpId = `otp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  console.log(`${LOG_PREFIX} [${otpId}] Generado nuevo código OTP: ${code}`)
  return code
}

/**
 * Guarda un código OTP para un usuario en Supabase
 */
export async function saveOTP(email: string, code: string): Promise<boolean> {
  const saveId = `save-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  console.log(`${LOG_PREFIX} [${saveId}] Guardando OTP para ${email}: ${code}`)

  const normalizedEmail = email.toLowerCase();

  // Inicializar bloqueos si es necesario
  if (!global.saveOTPLocks) {
    global.saveOTPLocks = {};
  }

  // Verificar si ya hay una operación en curso para este email
  if (global.saveOTPLocks[normalizedEmail]) {
    console.log(`${LOG_PREFIX} [${saveId}] Operación ya en curso para ${normalizedEmail}, omitiendo`);
    return false;
  }

  try {
    // Bloquear para este email
    global.saveOTPLocks[normalizedEmail] = true;

    const supabase = createServerSupabaseClient()

    // Calcular tiempo de expiración
    const expirationTime = new Date()
    expirationTime.setMinutes(expirationTime.getMinutes() + OTP_EXPIRATION_MINUTES)
    console.log(`${LOG_PREFIX} [${saveId}] Tiempo de expiración: ${expirationTime.toISOString()}`)

    // Verificar si ya existe un código para este email
    const { data: existingCodes, error: selectError } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("email", normalizedEmail)

    if (selectError) {
      console.error(`${LOG_PREFIX} [${saveId}] Error al buscar códigos existentes:`, selectError)
    }

    // Inicializar caché global si es necesario
    if (!global.verificationCodes) {
      global.verificationCodes = {};
    }

    // Si ya existe un código, actualizarlo
    if (existingCodes && existingCodes.length > 0) {
      console.log(`${LOG_PREFIX} [${saveId}] Actualizando código existente para ${normalizedEmail}`)

      const { error: updateError } = await supabase
        .from("verification_codes")
        .update({
          code: code,
          expires_at: expirationTime.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("email", normalizedEmail)

      if (updateError) {
        console.error(`${LOG_PREFIX} [${saveId}] Error al actualizar código:`, updateError)

        // Guardar en memoria global como respaldo
        global.verificationCodes[normalizedEmail] = {
          code,
          expires: expirationTime,
          saveId,
        }
        console.log(`${LOG_PREFIX} [${saveId}] Código guardado en memoria global (respaldo)`)

        return true // Devolver true porque tenemos respaldo en memoria
      }
    } else {
      // Insertar nuevo código
      console.log(`${LOG_PREFIX} [${saveId}] Insertando nuevo código para ${normalizedEmail}`)

      const { error: insertError } = await supabase.from("verification_codes").insert([
        {
          email: normalizedEmail,
          code: code,
          expires_at: expirationTime.toISOString(),
        },
      ])

      if (insertError) {
        console.error(`${LOG_PREFIX} [${saveId}] Error al insertar código:`, insertError)

        // Guardar en memoria global como respaldo
        global.verificationCodes[normalizedEmail] = {
          code,
          expires: expirationTime,
          saveId,
        }
        console.log(`${LOG_PREFIX} [${saveId}] Código guardado en memoria global (respaldo)`)

        return true // Devolver true porque tenemos respaldo en memoria
      }
    }

    // También guardar en memoria global para redundancia
    global.verificationCodes[normalizedEmail] = {
      code,
      expires: expirationTime,
      saveId,
    }
    console.log(`${LOG_PREFIX} [${saveId}] Código guardado en Supabase y memoria global`)

    return true
  } catch (error) {
    console.error(`${LOG_PREFIX} [${saveId}] Error al guardar el código OTP:`, error)

    // Inicializar caché global si es necesario
    if (!global.verificationCodes) {
      global.verificationCodes = {};
    }

    // Guardar en memoria global como último recurso
    global.verificationCodes[normalizedEmail] = {
      code,
      expires: new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60000),
      saveId,
    }
    console.log(`${LOG_PREFIX} [${saveId}] Código guardado solo en memoria global (último recurso)`)

    return true // Devolver true porque tenemos respaldo en memoria
  } finally {
    // Liberar el bloqueo
    delete global.saveOTPLocks[normalizedEmail];
  }
}

/**
 * Verifica un código OTP para un usuario usando Supabase
 */
export async function verifyOTP(email: string, code: string): Promise<VerificationResult> {
  const verifyId = `verify-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  console.log(`${LOG_PREFIX} [${verifyId}] Verificando código para ${email}: ${code}`)

  try {
    const normalizedEmail = email.toLowerCase()

    // Inicializar caché global si es necesario
    if (!global.verificationCodes) {
      global.verificationCodes = {};
    }

    // Verificar primero en memoria global (más rápido y funciona como respaldo)
    const memoryCode = global.verificationCodes[normalizedEmail]
    if (memoryCode) {
      console.log(`${LOG_PREFIX} [${verifyId}] Código encontrado en memoria para ${normalizedEmail}`)

      // Verificar si ha expirado
      if (new Date() > memoryCode.expires) {
        console.log(`${LOG_PREFIX} [${verifyId}] Código en memoria expirado para ${normalizedEmail}`)
        delete global.verificationCodes[normalizedEmail]
        return {
          success: false,
          message: "El código de verificación ha expirado. Por favor, solicita uno nuevo.",
        }
      }

      // Verificar si el código coincide
      if (memoryCode.code !== code) {
        console.log(`${LOG_PREFIX} [${verifyId}] Código en memoria incorrecto para ${normalizedEmail}`)
        return {
          success: false,
          message: "Código de verificación incorrecto",
        }
      }

      // Código válido en memoria, marcar usuario como verificado
      console.log(`${LOG_PREFIX} [${verifyId}] Código en memoria válido para ${normalizedEmail}`)
      const success = await markUserAsVerified(normalizedEmail)

      if (!success) {
        console.error(`${LOG_PREFIX} [${verifyId}] Error al marcar usuario como verificado`)
        return {
          success: false,
          message: "Error al verificar el usuario. Por favor, intenta nuevamente.",
        }
      }

      // Eliminar código de memoria
      delete global.verificationCodes[normalizedEmail]

      // Crear notificación
      await addNotificationToSupabase({
        type: "verification",
        title: "Usuario verificado",
        message: `El usuario con email ${email} ha verificado su cuenta.`,
        email: email,
      })

      return {
        success: true,
        message: "Verificación exitosa",
      }
    }

    // Si no está en memoria, verificar en Supabase
    console.log(`${LOG_PREFIX} [${verifyId}] Buscando código en Supabase para ${normalizedEmail}`)
    const supabase = createServerSupabaseClient()

    const { data: codes, error } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle()

    if (error) {
      console.error(`${LOG_PREFIX} [${verifyId}] Error al buscar código en Supabase:`, error)
      return {
        success: false,
        message: "Error al verificar el código. Por favor, intenta nuevamente.",
      }
    }

    if (!codes) {
      console.log(`${LOG_PREFIX} [${verifyId}] No se encontró código en Supabase para ${normalizedEmail}`)
      return {
        success: false,
        message: "No hay un código de verificación activo para este email",
      }
    }

    // Verificar si el código ha expirado
    if (new Date() > new Date(codes.expires_at)) {
      console.log(`${LOG_PREFIX} [${verifyId}] Código en Supabase expirado para ${normalizedEmail}`)

      // Eliminar código expirado
      await supabase.from("verification_codes").delete().eq("email", normalizedEmail)

      return {
        success: false,
        message: "El código de verificación ha expirado. Por favor, solicita uno nuevo.",
      }
    }

    // Verificar si el código coincide
    if (codes.code !== code) {
      console.log(`${LOG_PREFIX} [${verifyId}] Código en Supabase incorrecto para ${normalizedEmail}`)
      return {
        success: false,
        message: "Código de verificación incorrecto",
      }
    }

    // Código válido, marcar usuario como verificado
    console.log(`${LOG_PREFIX} [${verifyId}] Código en Supabase válido para ${normalizedEmail}`)
    const success = await markUserAsVerified(normalizedEmail)

    if (!success) {
      console.error(`${LOG_PREFIX} [${verifyId}] Error al marcar usuario como verificado`)
      return {
        success: false,
        message: "Error al verificar el usuario. Por favor, intenta nuevamente.",
      }
    }

    // Eliminar el código usado
    await supabase.from("verification_codes").delete().eq("email", normalizedEmail)

    // Crear notificación
    await addNotificationToSupabase({
      type: "verification",
      title: "Usuario verificado",
      message: `El usuario con email ${email} ha verificado su cuenta.`,
      email: email,
    })

    return {
      success: true,
      message: "Verificación exitosa",
    }
  } catch (error) {
    console.error(`${LOG_PREFIX} [${verifyId}] Error al verificar código:`, error)
    return {
      success: false,
      message: "Error interno al verificar el código",
    }
  }
}