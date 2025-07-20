import { jwtVerify } from "jose"

// Clave secreta para JWT (en producción, usar una variable de entorno)
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "tuenvioexpress_jwt_secret_key_2024")

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
