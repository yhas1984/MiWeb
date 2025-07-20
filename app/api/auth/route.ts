import { type NextRequest, NextResponse } from "next/server"
import { verifyAdminPassword, generateToken, changeAdminPassword } from "@/config/auth"

// Inicializar la contraseña de administrador al iniciar la aplicación
verifyAdminPassword("")

export async function POST(request: NextRequest) {
  try {
    const { password, action, newPassword } = await request.json()

    // Cambiar contraseña
    if (action === "change_password") {
      if (!password || !newPassword) {
        return NextResponse.json({ success: false, message: "Se requieren contraseña actual y nueva" }, { status: 400 })
      }

      const isValid = await verifyAdminPassword(password)

      if (!isValid) {
        return NextResponse.json({ success: false, message: "Contraseña actual incorrecta" }, { status: 401 })
      }

      const changed = await changeAdminPassword(newPassword)

      if (changed) {
        return NextResponse.json({
          success: true,
          message: "Contraseña cambiada correctamente",
        })
      } else {
        return NextResponse.json({ success: false, message: "Error al cambiar la contraseña" }, { status: 500 })
      }
    }

    // Login normal
    const isValid = await verifyAdminPassword(password)

    if (isValid) {
      // Generar token JWT
      const token = await generateToken()

      return NextResponse.json({
        success: true,
        token,
        expiresIn: "1 hora",
      })
    } else {
      return NextResponse.json({ success: false, message: "Contraseña incorrecta" }, { status: 401 })
    }
  } catch (error) {
    console.error("Error en la autenticación:", error)
    return NextResponse.json({ success: false, message: "Error en la autenticación" }, { status: 500 })
  }
}
