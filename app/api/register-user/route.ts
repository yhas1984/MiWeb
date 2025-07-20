import { type NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs"
import { readJsonFromFile, safeWriteJsonToFile } from "@/lib/file-utils"
import { addNotification } from "@/lib/notification-service"
import type { User } from "@/models/user"
import { generateOTP, saveOTP } from "@/services/verification-service"
import { sendVerificationEmail } from "@/services/email-service"

// Ruta al archivo JSON de usuarios registrados
const usersFilePath = path.join(process.cwd(), "data", "registered-users.json")

// Cache temporal en memoria para usuarios cuando no se puede escribir al archivo
const tempRegisteredUsers = new Map<string, User>()

// Función para asegurar que el directorio existe
function ensureDirectoryExists() {
  try {
    const dirPath = path.dirname(usersFilePath)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
    return true
  } catch (error) {
    console.error("Error al crear directorio:", error)
    return false
  }
}

// POST: Registrar un usuario directamente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, verified = false } = body

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email es requerido",
        },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    }

    console.log(
      `[REGISTER] Registrando usuario: ${email}, nombre: ${name || "no proporcionado"}, verificado: ${verified}`,
    )

    // Asegurar que el directorio existe
    const dirExists = ensureDirectoryExists()
    if (!dirExists) {
      console.error("[REGISTER] No se pudo crear el directorio de datos")
    }

    // Leer usuarios existentes
    let users: User[] = []
    try {
      users = readJsonFromFile<User[]>(usersFilePath, [])
      console.log(`[REGISTER] Usuarios actuales en archivo: ${users.length}`)
    } catch (error) {
      console.error("[REGISTER] Error al leer archivo de usuarios:", error)
      users = []
    }

    // Verificar si el usuario ya existe
    const existingUserIndex = users.findIndex((user) => user.email.toLowerCase() === email.toLowerCase())

    if (existingUserIndex >= 0) {
      console.log(`[REGISTER] Usuario existente encontrado en índice ${existingUserIndex}`)

      const existingUser = users[existingUserIndex]

      // Actualizar usuario existente si es necesario
      if (verified && !existingUser.verified) {
        console.log(`[REGISTER] Actualizando estado de verificación para usuario existente`)
        users[existingUserIndex].verified = true

        // Intentar guardar cambios
        const saved = safeWriteJsonToFile(usersFilePath, users)
        console.log(`[REGISTER] Guardado en archivo: ${saved ? "exitoso" : "fallido"}`)

        if (saved) {
          // Crear notificación
          try {
            await addNotification({
              type: "verification",
              title: "Usuario verificado",
              message: `El usuario ${existingUser.name} (${email}) ha sido verificado.`,
              email,
            })
          } catch (notifError) {
            console.error("[REGISTER] Error al crear notificación:", notifError)
          }

          return NextResponse.json(
            {
              success: true,
              message: "Usuario actualizado y verificado",
              user: users[existingUserIndex],
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
            },
          )
        } else {
          console.log(`[REGISTER] No se pudo guardar, actualizando en memoria temporal`)
          // Si no se pudo guardar, actualizar en memoria temporal
          tempRegisteredUsers.set(email, {
            ...existingUser,
            verified: true,
          })
        }
      }

      // Generar y enviar código OTP para usuario existente
      try {
        const otp = generateOTP()
        await saveOTP(email, otp)
        await sendVerificationEmail(email, existingUser.name || email.split("@")[0], otp)

        return NextResponse.json(
          {
            success: true,
            message: "El usuario ya existe. Se ha enviado un código de verificación.",
            user: existingUser,
            alreadyExists: true,
            verificationSent: true,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        )
      } catch (otpError) {
        console.error("[REGISTER] Error al enviar OTP:", otpError)
        return NextResponse.json(
          {
            success: true,
            message: "El usuario ya existe.",
            user: existingUser,
            alreadyExists: true,
            verificationSent: false,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        )
      }
    }

    // Crear nuevo usuario
    const newUser: User = {
      id: Date.now().toString(),
      email,
      name: name || email.split("@")[0], // Usar parte del email como nombre si no se proporciona
      registrationDate: new Date().toISOString(),
      verified,
    }

    console.log(`[REGISTER] Nuevo usuario creado: ${JSON.stringify(newUser)}`)

    // Añadir a la lista de usuarios
    users.push(newUser)

    // Intentar guardar la lista actualizada
    const saved = safeWriteJsonToFile(usersFilePath, users)
    console.log(`[REGISTER] Guardado en archivo: ${saved ? "exitoso" : "fallido"}`)

    if (!saved) {
      // Si no se puede guardar en archivo, guardar en memoria temporal
      tempRegisteredUsers.set(email, newUser)
      console.log(`[REGISTER] Usuario ${email} guardado en memoria temporal`)

      // Crear notificación
      try {
        await addNotification({
          type: "registration",
          title: "Nuevo usuario registrado (temporal)",
          message: `${newUser.name} (${email}) se ha registrado en la plataforma (almacenado temporalmente).`,
          email,
        })
      } catch (notifError) {
        console.error("[REGISTER] Error al crear notificación temporal:", notifError)
      }
    } else {
      // Crear notificación
      try {
        await addNotification({
          type: "registration",
          title: "Nuevo usuario registrado",
          message: `${newUser.name} (${email}) se ha registrado en la plataforma.`,
          email,
        })
      } catch (notifError) {
        console.error("[REGISTER] Error al crear notificación:", notifError)
      }
    }

    // Generar y enviar código OTP
    try {
      const otp = generateOTP()
      await saveOTP(email, otp)
      await sendVerificationEmail(email, newUser.name, otp)

      return NextResponse.json(
        {
          success: true,
          message: "Usuario registrado correctamente. Se ha enviado un código de verificación.",
          user: newUser,
          temporary: !saved,
          verificationSent: true,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    } catch (otpError) {
      console.error("[REGISTER] Error al enviar OTP:", otpError)

      return NextResponse.json(
        {
          success: true,
          message: "Usuario registrado correctamente, pero no se pudo enviar el código de verificación.",
          user: newUser,
          temporary: !saved,
          verificationSent: false,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    }
  } catch (error) {
    console.error("[REGISTER] Error crítico al registrar usuario:", error)

    // Asegurar que siempre devolvemos JSON válido
    const errorResponse = {
      success: false,
      message: "Error interno del servidor al procesar el registro",
      details: error instanceof Error ? error.message : "Error desconocido",
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(errorResponse, {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }
}

// GET: Obtener información sobre usuarios temporales (para debugging)
export async function GET() {
  try {
    const tempUsers = Array.from(tempRegisteredUsers.entries()).map(([email, user]) => ({
      email,
      user,
    }))

    return NextResponse.json(
      {
        success: true,
        temporaryUsers: tempUsers,
        count: tempUsers.length,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error) {
    console.error("[REGISTER] Error al obtener usuarios temporales:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Error al obtener usuarios temporales",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
