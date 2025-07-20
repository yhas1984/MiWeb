import { type NextRequest, NextResponse } from "next/server"
import path from "path"
import { readJsonFromFile, safeWriteJsonToFile } from "@/lib/file-utils"
import { verifyToken, extractTokenFromRequest } from "@/config/auth"
import { addNotification } from "@/lib/notification-service"
import type { User } from "@/models/user"

// Ruta al archivo JSON de usuarios registrados
const usersFilePath = path.join(process.cwd(), "data", "registered-users.json")

// POST: Verificar manualmente un usuario
export async function POST(request: NextRequest) {
  // Verificar autenticación
  const token = extractTokenFromRequest(request)
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json(
      {
        success: false,
        message: "No autorizado",
      },
      { status: 401 },
    )
  }

  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email es requerido",
        },
        { status: 400 },
      )
    }

    // Leer usuarios existentes
    const users = readJsonFromFile<User[]>(usersFilePath, [])

    // Buscar todas las coincidencias
    const matchingIndices: number[] = []
    users.forEach((user, index) => {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        matchingIndices.push(index)
      }
    })

    // Si no hay usuarios coincidentes, intentar crear uno
    if (matchingIndices.length === 0) {
      // Crear un nuevo usuario
      const newUser: User = {
        id: Date.now().toString(),
        email,
        name: email.split("@")[0], // Usar parte del email como nombre
        registrationDate: new Date().toISOString(),
        verified: true, // Ya verificado
      }

      users.push(newUser)

      // Crear notificación
      addNotification({
        type: "system",
        title: "Usuario creado y verificado manualmente",
        message: `El administrador ha creado y verificado manualmente al usuario ${email}.`,
        email,
      })

      if (safeWriteJsonToFile(usersFilePath, users)) {
        return NextResponse.json({
          success: true,
          message: "Usuario creado y verificado manualmente",
          created: true,
          verified: true,
        })
      } else {
        throw new Error("Error al guardar el usuario")
      }
    }

    // Verificar todos los usuarios coincidentes
    let alreadyVerified = true
    matchingIndices.forEach((index) => {
      if (!users[index].verified) {
        alreadyVerified = false
        users[index].verified = true
      }
    })

    // Si todos ya estaban verificados
    if (alreadyVerified) {
      return NextResponse.json({
        success: true,
        message: "El usuario ya estaba verificado",
        verified: true,
        alreadyVerified: true,
      })
    }

    // Guardar los cambios
    if (safeWriteJsonToFile(usersFilePath, users)) {
      // Crear notificación
      addNotification({
        type: "verification",
        title: "Usuario verificado manualmente",
        message: `El administrador ha verificado manualmente al usuario ${email}.`,
        email,
      })

      return NextResponse.json({
        success: true,
        message: "Usuario verificado manualmente",
        verified: true,
      })
    } else {
      throw new Error("Error al guardar los cambios")
    }
  } catch (error) {
    console.error("Error al verificar usuario:", error)
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
