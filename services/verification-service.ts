import path from "path"
import type { User, VerificationResult } from "@/models/user"
import { readJsonFromFile, safeWriteJsonToFile } from "@/lib/file-utils"

// Añadir al inicio del archivo, después de las importaciones
const LOG_PREFIX = "[VERIFICATION-SERVICE]"
console.log(`${LOG_PREFIX} Módulo inicializado - ${new Date().toISOString()}`)

// Ruta al archivo JSON de usuarios registrados
const usersFilePath = path.join(process.cwd(), "data", "registered-users.json")

// Tiempo de expiración del código OTP en minutos
const OTP_EXPIRATION_MINUTES = 30

// Número máximo de intentos de verificación
const MAX_VERIFICATION_ATTEMPTS = 5

// Almacenamiento temporal de intentos de verificación
const verificationAttempts: Record<string, number> = {}

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
 * Busca todas las instancias de un usuario por email
 * Devuelve un array con los índices de todas las coincidencias
 */
function findUserIndicesByEmail(users: User[], email: string): number[] {
  const indices: number[] = []
  users.forEach((user, index) => {
    if (user.email.toLowerCase() === email.toLowerCase()) {
      indices.push(index)
    }
  })
  return indices
}

/**
 * Guarda un código OTP para un usuario
 * Si hay múltiples usuarios con el mismo email, actualiza todos
 */
export async function saveOTP(email: string, code: string): Promise<boolean> {
  const saveId = `save-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  console.log(`${LOG_PREFIX} [${saveId}] Guardando OTP para ${email}: ${code}`)

  try {
    // Leer usuarios existentes
    const users = readJsonFromFile<User[]>(usersFilePath, [])
    console.log(`${LOG_PREFIX} [${saveId}] Usuarios leídos: ${users.length}`)

    // Buscar todos los índices del usuario
    const userIndices = findUserIndicesByEmail(users, email)
    console.log(`${LOG_PREFIX} [${saveId}] Índices encontrados para ${email}: ${userIndices.length}`)

    if (userIndices.length === 0) {
      console.error(`${LOG_PREFIX} [${saveId}] Usuario con email ${email} no encontrado`)
      return false
    }

    // Establecer el código y su tiempo de expiración para todas las instancias
    const expirationTime = new Date()
    expirationTime.setMinutes(expirationTime.getMinutes() + OTP_EXPIRATION_MINUTES)
    console.log(`${LOG_PREFIX} [${saveId}] Tiempo de expiración: ${expirationTime.toISOString()}`)

    userIndices.forEach((index) => {
      users[index].verificationCode = code
      users[index].verificationExpires = expirationTime.toISOString()
      console.log(`${LOG_PREFIX} [${saveId}] Actualizado usuario en índice ${index}`)
    })

    // Guardar los cambios
    const saved = safeWriteJsonToFile(usersFilePath, users)
    console.log(`${LOG_PREFIX} [${saveId}] Guardado en archivo: ${saved ? "ÉXITO" : "FALLO"}`)

    // También guardar en memoria global para redundancia
    global.verificationCodes = global.verificationCodes || {}
    global.verificationCodes[email.toLowerCase()] = {
      code,
      expires: expirationTime,
      saveId,
    }
    console.log(`${LOG_PREFIX} [${saveId}] Guardado en memoria global`)

    return saved
  } catch (error) {
    console.error(`${LOG_PREFIX} [${saveId}] Error al guardar el código OTP:`, error)
    return false
  }
}

/**
 * Verifica un código OTP para un usuario
 * Si hay múltiples usuarios con el mismo email, verifica todos
 */
export async function verifyOTP(email: string, code: string): Promise<VerificationResult> {
  try {
    // Verificar intentos
    const attemptKey = `${email}:${new Date().toISOString().split("T")[0]}`
    verificationAttempts[attemptKey] = (verificationAttempts[attemptKey] || 0) + 1

    if (verificationAttempts[attemptKey] > MAX_VERIFICATION_ATTEMPTS) {
      return {
        success: false,
        message: "Has excedido el número máximo de intentos. Por favor, solicita un nuevo código.",
      }
    }

    // Leer usuarios existentes
    const users = readJsonFromFile<User[]>(usersFilePath, [])

    // Buscar todos los índices del usuario
    const userIndices = findUserIndicesByEmail(users, email)

    if (userIndices.length === 0) {
      return {
        success: false,
        message: "Usuario no encontrado",
      }
    }

    // Verificar el código en cualquiera de las instancias
    let validCodeFound = false
    let expiredCodeFound = false
    let userWithValidCode: User | undefined = undefined

    for (const index of userIndices) {
      const user = users[index]

      // Verificar si el código existe
      if (!user.verificationCode) continue

      // Verificar si ha expirado
      if (user.verificationExpires && new Date(user.verificationExpires) < new Date()) {
        expiredCodeFound = true
        continue
      }

      // Verificar si el código coincide
      if (user.verificationCode === code) {
        validCodeFound = true
        userWithValidCode = user
        break
      }
    }

    // Si no se encontró un código válido
    if (!validCodeFound) {
      if (expiredCodeFound) {
        return {
          success: false,
          message: "El código de verificación ha expirado. Por favor, solicita uno nuevo.",
        }
      }
      return {
        success: false,
        message: "Código de verificación incorrecto o no existe un código activo.",
      }
    }

    // Marcar TODAS las instancias del usuario como verificadas
    userIndices.forEach((index) => {
      users[index].verified = true
      users[index].verificationCode = undefined
      users[index].verificationExpires = undefined
    })

    // Guardar los cambios
    if (safeWriteJsonToFile(usersFilePath, users)) {
      // Limpiar los intentos de verificación
      delete verificationAttempts[attemptKey]

      return {
        success: true,
        message: "Verificación exitosa",
        user: userWithValidCode, // Ahora es User | undefined
      }
    } else {
      return {
        success: false,
        message: "Error al guardar la verificación",
      }
    }
  } catch (error) {
    console.error("Error al verificar el código OTP:", error)
    return {
      success: false,
      message: "Error interno al verificar el código",
    }
  }
}

/**
 * Verifica si un usuario está verificado
 * Si hay múltiples usuarios con el mismo email, devuelve true si al menos uno está verificado
 */
export function isUserVerified(email: string): boolean {
  try {
    const users = readJsonFromFile<User[]>(usersFilePath, [])
    const matchingUsers = users.filter((user) => user.email.toLowerCase() === email.toLowerCase())
    return matchingUsers.some((user) => user.verified)
  } catch (error) {
    console.error("Error al verificar el estado del usuario:", error)
    return false
  }
}

/**
 * Solicita un nuevo código OTP para un usuario
 */
export async function requestNewOTP(email: string): Promise<string | null> {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  console.log(`${LOG_PREFIX} [${requestId}] Solicitando nuevo OTP para ${email}`)

  try {
    const users = readJsonFromFile<User[]>(usersFilePath, [])
    console.log(`${LOG_PREFIX} [${requestId}] Usuarios leídos: ${users.length}`)

    const userIndices = findUserIndicesByEmail(users, email)
    console.log(`${LOG_PREFIX} [${requestId}] Índices encontrados: ${userIndices.length}`)

    if (userIndices.length === 0) {
      console.log(`${LOG_PREFIX} [${requestId}] No se encontraron usuarios para ${email}`)
      return null
    }

    const newCode = generateOTP()
    console.log(`${LOG_PREFIX} [${requestId}] Nuevo código generado: ${newCode}`)

    const saved = await saveOTP(email, newCode)
    console.log(`${LOG_PREFIX} [${requestId}] Resultado de guardar OTP: ${saved ? "ÉXITO" : "FALLO"}`)

    if (saved) {
      return newCode
    }

    return null
  } catch (error) {
    console.error(`${LOG_PREFIX} [${requestId}] Error al solicitar nuevo código OTP:`, error)
    return null
  }
}