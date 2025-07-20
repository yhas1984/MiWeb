// Configuración de administrador
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "tU3nv103xpr3ss.3s"

// Función para verificar la contraseña de administrador
export function verifyAdminPassword(password: string): boolean {
  console.log("Verificando contraseña con:", ADMIN_PASSWORD)
  return password === ADMIN_PASSWORD
}
