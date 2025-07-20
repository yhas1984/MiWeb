import { type NextRequest, NextResponse } from "next/server"
import path from "path"
import { readJsonFromFile } from "@/lib/file-utils"
import type { User } from "@/models/user"

// Ruta al archivo JSON de usuarios registrados
const usersFilePath = path.join(process.cwd(), "data", "registered-users.json")

// Cache temporal en memoria para usuarios
const tempRegisteredUsers = new Map<string, User>()

export async function POST(request: NextRequest) {
  // Asegurar que siempre devolvemos JSON válido
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
  }

  try {
    console.log("[CHECK-REG] Iniciando verificación de registro")

    // Parsear el cuerpo de la solicitud
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("[CHECK-REG] Error al parsear JSON:", parseError)
      return NextResponse.json(
        {
          success: false,
          message: "Datos de solicitud inválidos",
          isRegistered: false,
          verified: false,
        },
        { status: 400, headers },
      )
    }

    const { email } = body

    if (!email || typeof email !== "string") {
      console.error("[CHECK-REG] Email no proporcionado o inválido")
      return NextResponse.json(
        {
          success: false,
          message: "Email es requerido y debe ser una cadena válida",
          isRegistered: false,
          verified: false,
        },
        { status: 400, headers },
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    console.log(`[CHECK-REG] Verificando registro para: ${normalizedEmail}`)

    // Leer usuarios del archivo
    let users: User[] = []
    try {
      users = readJsonFromFile<User[]>(usersFilePath, [])
      console.log(`[CHECK-REG] Usuarios en archivo: ${users.length}`)
    } catch (fileError) {
      console.error("[CHECK-REG] Error al leer archivo de usuarios:", fileError)
      // Continuar con array vacío si no se puede leer el archivo
      users = []
    }

    // Buscar usuario en el archivo
    let user = users.find((u) => u.email.toLowerCase() === normalizedEmail)

    // Si no se encuentra en el archivo, buscar en memoria temporal
    if (!user && tempRegisteredUsers.has(normalizedEmail)) {
      user = tempRegisteredUsers.get(normalizedEmail)
      console.log(`[CHECK-REG] Usuario encontrado en memoria temporal`)
    }

    if (user) {
      console.log(`[CHECK-REG] Usuario encontrado: ${user.email}, verificado: ${user.verified}`)

      return NextResponse.json(
        {
          success: true,
          isRegistered: true,
          verified: user.verified || false,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            registrationDate: user.registrationDate,
            verified: user.verified || false,
          },
          message: user.verified ? "Usuario registrado y verificado" : "Usuario registrado pero no verificado",
        },
        { headers },
      )
    } else {
      console.log(`[CHECK-REG] Usuario no encontrado: ${normalizedEmail}`)

      return NextResponse.json(
        {
          success: true,
          isRegistered: false,
          verified: false,
          user: null,
          message: "Usuario no registrado",
        },
        { headers },
      )
    }
  } catch (error) {
    console.error("[CHECK-REG] Error crítico al verificar registro:", error)

    // Asegurar que siempre devolvemos JSON válido incluso en caso de error crítico
    const errorResponse = {
      success: false,
      message: "Error interno del servidor al verificar el registro",
      details: error instanceof Error ? error.message : "Error desconocido",
      isRegistered: false,
      verified: false,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(errorResponse, {
      status: 500,
      headers,
    })
  }
}

// GET: Endpoint para debugging (obtener información sobre usuarios temporales)
export async function GET() {
  const headers = {
    "Content-Type": "application/json",
  }

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
        message: "Usuarios temporales obtenidos correctamente",
      },
      { headers },
    )
  } catch (error) {
    console.error("[CHECK-REG] Error al obtener usuarios temporales:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Error al obtener usuarios temporales",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      {
        status: 500,
        headers,
      },
    )
  }
}
