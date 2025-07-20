import { type NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs"
import { readJsonFromFile, safeWriteJsonToFile } from "@/lib/file-utils"
import type { User } from "@/models/user"

// Ruta al archivo JSON de usuarios registrados
const usersFilePath = path.join(process.cwd(), "data", "registered-users.json")

// Definir tipos para las propiedades globales personalizadas
declare global {
  var verifiedUsers: Record<string, { verified: boolean; timestamp: string }>
  var tempRegisteredUsers: Record<string, User>
}

// POST: Actualizar manualmente el estado de verificación de un usuario
export async function POST(request: NextRequest) {
  try {
    const { email, verified = true } = await request.json()

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email es requerido",
        },
        { status: 400 },
      )
    }

    console.log(`Actualizando estado de verificación para ${email} a ${verified}`)

    // Inicializar propiedades globales si no existen
    if (!global.verifiedUsers) {
      global.verifiedUsers = {}
    }
    if (!global.tempRegisteredUsers) {
      global.tempRegisteredUsers = {}
    }

    // Actualizar en memoria global
    if (verified) {
      global.verifiedUsers[email] = {
        verified: true,
        timestamp: new Date().toISOString(),
      }
      console.log(`Usuario ${email} marcado como verificado en memoria global`)
    } else {
      delete global.verifiedUsers[email]
      console.log(`Usuario ${email} eliminado de memoria global de verificados`)
    }

    // Actualizar en memoria temporal si existe
    if (global.tempRegisteredUsers[email]) {
      global.tempRegisteredUsers[email].verified = verified
      console.log(`Usuario temporal ${email} actualizado: verified=${verified}`)
    }

    // Intentar actualizar en archivo
    try {
      if (!fs.existsSync(usersFilePath)) {
        console.log(`Archivo de usuarios no encontrado: ${usersFilePath}`)
        return NextResponse.json({
          success: true,
          message: "Usuario actualizado en memoria",
          fileUpdated: false,
        })
      }

      const users = readJsonFromFile<User[]>(usersFilePath, [])

      // Buscar todas las coincidencias
      const matchingIndices: number[] = []
      users.forEach((user, index) => {
        if (user.email.toLowerCase() === email.toLowerCase()) {
          matchingIndices.push(index)
        }
      })

      if (matchingIndices.length === 0) {
        console.log(`No se encontraron usuarios con email ${email} en el archivo`)

        // Si no existe, crear un nuevo usuario verificado
        if (verified) {
          const newUser: User = {
            id: Date.now().toString(),
            email,
            name: email.split("@")[0],
            registrationDate: new Date().toISOString(),
            verified: true,
          }

          users.push(newUser)
          console.log(`Creado nuevo usuario verificado para ${email}`)

          const saved = safeWriteJsonToFile(usersFilePath, users)
          return NextResponse.json({
            success: true,
            message: "Usuario creado y verificado",
            fileUpdated: saved,
          })
        }

        return NextResponse.json({
          success: true,
          message: "No se encontraron usuarios para actualizar en archivo",
          fileUpdated: false,
        })
      }

      // Actualizar todos los usuarios coincidentes
      matchingIndices.forEach((index) => {
        users[index].verified = verified
      })

      const saved = safeWriteJsonToFile(usersFilePath, users)
      console.log(`Usuarios actualizados en archivo: ${saved ? "éxito" : "fallo"}`)

      return NextResponse.json({
        success: true,
        message: `${matchingIndices.length} usuarios actualizados en archivo`,
        fileUpdated: saved,
      })
    } catch (fileError) {
      console.error("Error al actualizar archivo:", fileError)
      return NextResponse.json({
        success: true,
        message: "Usuario actualizado en memoria pero no en archivo",
        fileUpdated: false,
        error: fileError instanceof Error ? fileError.message : "Error desconocido",
      })
    }
  } catch (error) {
    console.error("Error al actualizar estado de verificación:", error)
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