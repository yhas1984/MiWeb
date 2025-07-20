import { type NextRequest, NextResponse } from "next/server"
import { generateOTP, saveOTP } from "@/services/verification-service"
import { sendVerificationEmail } from "@/services/email-service"
import { readJsonFromFile, safeWriteJsonToFile } from "@/lib/file-utils"
import { addNotification } from "@/lib/notification-service"
import type { User } from "@/models/user"
import path from "path"

// Ruta al archivo JSON de usuarios registrados
const usersFilePath = path.join(process.cwd(), "data", "registered-users.json")

// POST: Recibir datos del formulario y generar código OTP
export async function POST(request: NextRequest) {
  try {
    // Verificar la clave secreta para asegurar que la solicitud viene de Google Forms
    const authHeader = request.headers.get("Authorization")
    const webhookSecret = process.env.WEBHOOK_SECRET

    if (!authHeader || authHeader !== `Bearer ${webhookSecret}`) {
      return NextResponse.json(
        {
          success: false,
          message: "No autorizado",
        },
        { status: 401 },
      )
    }

    // Obtener datos del formulario
    const formData = await request.json()

    // Extraer email y nombre (ajustar según la estructura de datos de Google Forms)
    const email = formData.email
    const name = formData.name

    if (!email || !name) {
      return NextResponse.json(
        {
          success: false,
          message: "Datos incompletos",
        },
        { status: 400 },
      )
    }

    // Leer usuarios existentes
    const users = readJsonFromFile<User[]>(usersFilePath, [])

    // Verificar si el usuario ya existe
    const existingUser = users.find((user) => user.email.toLowerCase() === email.toLowerCase())

    if (existingUser) {
      // Si el usuario ya está verificado, no hacer nada
      if (existingUser.verified) {
        return NextResponse.json({
          success: true,
          message: "Usuario ya verificado",
          verified: true,
        })
      }

      // Si no está verificado, generar nuevo código
      const code = generateOTP()
      await saveOTP(email, code)
      await sendVerificationEmail(email, name, code)

      // Crear notificación en el sistema en lugar de enviar email
      addNotification({
        type: "verification",
        title: "Código de verificación enviado",
        message: `Se ha enviado un código de verificación al usuario ${name} (${email}).`,
        email: email,
      })

      return NextResponse.json({
        success: true,
        message: "Código de verificación enviado",
        verified: false,
      })
    }

    // Crear nuevo usuario
    const newUser: User = {
      id: Date.now().toString(),
      email,
      name,
      registrationDate: new Date().toISOString(),
      verified: false,
      // Si hay un código de referido en el formulario, guardarlo
      referredBy: formData.referredBy || undefined,
    }

    // Añadir a la lista de usuarios
    users.push(newUser)

    // Guardar la lista actualizada
    if (!safeWriteJsonToFile(usersFilePath, users)) {
      throw new Error("Error al guardar el usuario")
    }

    // Crear notificación de nuevo registro
    addNotification({
      type: "registration",
      title: "Nuevo usuario registrado",
      message: `${name} (${email}) se ha registrado en la plataforma.`,
      email: email,
    })

    // Generar código OTP
    const code = generateOTP()
    await saveOTP(email, code)

    // Enviar email con el código
    const emailSent = await sendVerificationEmail(email, name, code)

    if (!emailSent) {
      return NextResponse.json(
        {
          success: false,
          message: "Error al enviar el email de verificación",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Usuario registrado y código de verificación enviado",
    })
  } catch (error) {
    console.error("Error en el webhook de registro:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error al procesar el registro",
      },
      { status: 500 },
    )
  }
}
