import { type NextRequest, NextResponse } from "next/server"
import path from "path"
import { readJsonFromFile, safeWriteJsonToFile } from "@/lib/file-utils"
import { addNotification } from "@/lib/notification-service"
import type { User } from "@/models/user"

// Ruta al archivo JSON de usuarios registrados
const usersFilePath = path.join(process.cwd(), "data", "registered-users.json")

// POST: Actualizar estado de verificación de un usuario
export async function POST(request: NextRequest) {
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

    // Si no hay usuarios coincidentes, no hacer nada
    if (matchingIndices.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No se encontraron usuarios para actualizar",
        updated: false,
      })
    }

    // Actualizar todos los usuarios coincidentes
    matchingIndices.forEach((index) => {
      users[index].verified = true
      users[index].verificationCode = undefined
      users[index].verificationExpires = undefined
    })

    // Guardar los cambios
    const saved = safeWriteJsonToFile(usersFilePath, users)

    if (!saved) {
      return NextResponse.json(
        {
          success: false,
          message: "Error al guardar los cambios",
        },
        { status: 500 },
      )
    }

    // Crear notificación de verificación
    const user = users[matchingIndices[0]]
    addNotification({
      type: "verification",
      title: "Usuario verificado",
      message: `El usuario ${user.name} (${email}) ha verificado su cuenta.`,
      email: email,
    })

    return NextResponse.json({
      success: true,
      message: `Se actualizaron ${matchingIndices.length} usuarios`,
      updated: true,
      count: matchingIndices.length,
    })
  } catch (error) {
    console.error("Error al actualizar verificación:", error)
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
