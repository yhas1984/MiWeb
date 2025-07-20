import { SignJWT, jwtVerify } from "jose"
import bcrypt from "bcryptjs"
import fs from "fs"
import path from "path"
// Corregir la importación para asegurarnos de que sea la ruta correcta
import { ADMIN_PASSWORD } from "../config/admin"

// Archivo para almacenar la contraseña hasheada del administrador
const adminFilePath = path.join(process.cwd(), "data", "admin.json")

// Asegurarse de que el directorio existe
const ensureDirectoryExists = (filePath: string) => {
  const dirname = path.dirname(filePath)
  if (fs.existsSync(dirname)) {
    return true
  }
  fs.mkdirSync(dirname, { recursive: true })
}

// Contraseña predeterminada (importada desde config/admin.ts)
const DEFAULT_ADMIN_PASSWORD = ADMIN_PASSWORD

// Clave secreta para JWT (en producción, usar una variable de entorno)
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "tuenvioexpress_jwt_secret_key_2024")

// Duración del token (1 hora)
const TOKEN_EXPIRATION = "1h"

// Inicializar el archivo de admin si no existe
export const initAdminPassword = async () => {
  try {
    ensureDirectoryExists(adminFilePath)

    if (!fs.existsSync(adminFilePath)) {
      // Crear hash de la contraseña predeterminada
      const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10)

      // Guardar en el archivo
      fs.writeFileSync(
        adminFilePath,
        JSON.stringify({
          hashedPassword,
          createdAt: new Date().toISOString(),
        }),
      )

      console.log("Contraseña de administrador inicializada")
    }
  } catch (error) {
    console.error("Error al inicializar la contraseña de administrador:", error)
  }
}

// Obtener la contraseña hasheada del administrador
export const getAdminHashedPassword = (): string => {
  try {
    if (!fs.existsSync(adminFilePath)) {
      initAdminPassword()
      return ""
    }

    const data = JSON.parse(fs.readFileSync(adminFilePath, "utf8"))
    return data.hashedPassword
  } catch (error: any) {
    console.error("Error al obtener la contraseña hasheada:", error)
    return ""
  }
}

// Cambiar la contraseña del administrador
export const changeAdminPassword = async (newPassword: string): Promise<boolean> => {
  try {
    ensureDirectoryExists(adminFilePath)

    // Crear hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Guardar en el archivo
    fs.writeFileSync(
      adminFilePath,
      JSON.stringify({
        hashedPassword,
        updatedAt: new Date().toISOString(),
      }),
    )

    return true
  } catch (error) {
    console.error("Error al cambiar la contraseña:", error)
    return false
  }
}

// Verificar la contraseña del administrador
export const verifyAdminPassword = async (password: string): Promise<boolean> => {
  try {
    const hashedPassword = getAdminHashedPassword()

    if (!hashedPassword) {
      await initAdminPassword()
      // Comparación directa con la contraseña predeterminada
      console.log("Usando contraseña predeterminada:", DEFAULT_ADMIN_PASSWORD)
      return password === DEFAULT_ADMIN_PASSWORD
    }

    return await bcrypt.compare(password, hashedPassword)
  } catch (error) {
    console.error("Error al verificar la contraseña:", error)
    return false
  }
}

// Generar un token JWT
export const generateToken = async (): Promise<string> => {
  try {
    const token = await new SignJWT({ role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(TOKEN_EXPIRATION)
      .sign(JWT_SECRET)

    return token
  } catch (error) {
    console.error("Error al generar el token:", error)
    throw error
  }
}

// Verificar un token JWT
export const verifyToken = async (token: string): Promise<boolean> => {
  try {
    if (!token || token.trim() === "") {
      console.log("Token vacío o inválido")
      return false
    }

    // Verificar que JWT_SECRET no esté vacío
    if (!JWT_SECRET || JWT_SECRET.length === 0) {
      console.error("JWT_SECRET no está configurado correctamente")
      return false
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)

      // Verificar que el payload tenga la estructura esperada
      if (!payload || typeof payload !== "object") {
        console.log("Payload del token inválido")
        return false
      }

      // Verificar que el rol sea admin
      if (payload.role !== "admin") {
        console.log("Token no tiene rol de administrador")
        return false
      }

      // Verificar que el token no haya expirado
      const now = Math.floor(Date.now() / 1000)
      if (payload.exp && payload.exp < now) {
        console.log("Token expirado")
        return false
      }

      return true
    } catch (jwtError) {
      console.error("Error al verificar JWT:", jwtError)
      return false
    }
  } catch (error) {
    console.error("Error general al verificar el token:", error)
    return false
  }
}

// Extraer token de los headers de la solicitud
export const extractTokenFromRequest = (request: Request): string | null => {
  const authHeader = request.headers.get("Authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  return authHeader.split(" ")[1]
}
