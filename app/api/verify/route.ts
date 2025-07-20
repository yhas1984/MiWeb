import { type NextRequest, NextResponse } from "next/server"
import { verifyOTP } from "@/services/verification-service"
import { sendVerificationEmail } from "@/services/email-service"
import { readJsonFromFile, safeWriteJsonToFile } from "@/lib/file-utils"
import type { User } from "@/models/user"
import path from "path"
import fs from "fs"

// Ruta al archivo JSON de usuarios registrados
const usersFilePath = path.join(process.cwd(), "data", "registered-users.json")

// Función para asegurar que el archivo de usuarios existe
function ensureUsersFileExists() {
  try {
    const dirPath = path.dirname(usersFilePath)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }

    if (!fs.existsSync(usersFilePath)) {
      fs.writeFileSync(usersFilePath, JSON.stringify([], null, 2), "utf8")
      console.log(`Archivo de usuarios creado en ${usersFilePath}`)
    }
    return true
  } catch (error) {
    console.error("Error al crear archivo de usuarios:", error)
    return false
  }
}

// POST: Verificar código OTP
export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        {
          success: false,
          message: "Email y código son requeridos",
        },
        { status: 400 },
      )
    }

    const result = await verifyOTP(email, code)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error al verificar código:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error al procesar la verificación",
      },
      { status: 500 },
    )
  }
}

// GET: Solicitar nuevo código OTP
export async function GET(request: NextRequest) {
  try {
    // Asegurar que el archivo de usuarios existe
    ensureUsersFileExists()

    const email = request.nextUrl.searchParams.get("email")
    console.log(`Solicitud de código para email: ${email}`)

    if (!email) {
      console.log("Email no proporcionado en la solicitud")
      return NextResponse.json(
        {
          success: false,
          message: "Email es requerido",
        },
        { status: 400 },
      )
    }

    // Verificar si el usuario existe
    const users = readJsonFromFile<User[]>(usersFilePath, [])
    console.log(`Usuarios en el sistema: ${users.length}`)

    // Buscar todas las coincidencias
    const matchingUsers = users.filter((user) => user.email.toLowerCase() === email.toLowerCase())
    console.log(`Usuarios coincidentes: ${matchingUsers.length}`)

    // Si no hay usuarios coincidentes, crear uno temporal
    if (matchingUsers.length === 0) {
      console.log(`Creando usuario temporal para ${email}`)
      const name = email.split("@")[0] || "Usuario"

      const newUser: User = {
        id: Date.now().toString(),
        email,
        name,
        registrationDate: new Date().toISOString(),
        verified: false,
      }

      users.push(newUser)
      if (!safeWriteJsonToFile(usersFilePath, users)) {
        console.error("Error al guardar el usuario temporal")
        return NextResponse.json(
          {
            success: false,
            message: "Error al crear usuario temporal",
          },
          { status: 500 },
        )
      }

      console.log(`Usuario temporal creado: ${email}`)
    }

    // Usar el primer usuario encontrado o el recién creado
    const user =
      matchingUsers.length > 0 ? matchingUsers[0] : users.find((u) => u.email.toLowerCase() === email.toLowerCase())

    if (!user) {
      console.error("Error inesperado: usuario no encontrado después de crearlo")
      return NextResponse.json(
        {
          success: false,
          message: "Error interno del servidor",
        },
        { status: 500 },
      )
    }

    // Generar nuevo código OTP
    const newCode = generateOTP()
    console.log(`Código generado para ${email}: ${newCode}`)

    // Guardar el código OTP
    const saved = await saveOTP(email, newCode)
    if (!saved) {
      console.error(`Error al guardar el código OTP para ${email}`)
      return NextResponse.json(
        {
          success: false,
          message: "Error al generar nuevo código",
        },
        { status: 500 },
      )
    }

    // Enviar email con el código
    try {
      const emailSent = await sendVerificationEmail(email, user.name, newCode)
      console.log(`Email enviado a ${email}: ${emailSent ? "Éxito" : "Fallo"}`)

      if (!emailSent) {
        return NextResponse.json(
          {
            success: false,
            message: "Error al enviar el email de verificación",
          },
          { status: 500 },
        )
      }
    } catch (emailError) {
      console.error("Error al enviar email:", emailError)
      return NextResponse.json(
        {
          success: false,
          message: "Error al enviar el email de verificación",
          details: emailError instanceof Error ? emailError.message : "Error desconocido",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Código de verificación enviado correctamente",
    })
  } catch (error) {
    console.error("Error al solicitar nuevo código:", error)
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

// Función para generar un código OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Función para guardar un código OTP
async function saveOTP(email: string, code: string): Promise<boolean> {
  try {
    // Leer usuarios existentes
    const users = readJsonFromFile<User[]>(usersFilePath, [])

    // Buscar todas las coincidencias
    const matchingIndices: number[] = []
    users.forEach((user, index) => {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        matchingIndices.push(index)
      }
    })

    if (matchingIndices.length === 0) {
      console.error(`Usuario con email ${email} no encontrado al guardar OTP`)
      return false
    }

    // Establecer el código y su tiempo de expiración para todas las instancias
    const expirationTime = new Date()
    expirationTime.setMinutes(expirationTime.getMinutes() + 30) // 30 minutos de expiración

    matchingIndices.forEach((index) => {
      users[index].verificationCode = code
      users[index].verificationExpires = expirationTime.toISOString()
    })

    // Guardar los cambios
    return safeWriteJsonToFile(usersFilePath, users)
  } catch (error) {
    console.error("Error al guardar el código OTP:", error)
    return false
  }
}
