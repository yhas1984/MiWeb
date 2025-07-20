import { type NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { verifyToken, extractTokenFromRequest } from "@/config/auth"

// Ruta al archivo JSON de usuarios registrados
const usersFilePath = path.join(process.cwd(), "data", "registered-users.json")

// Asegurarse de que el directorio existe
const ensureDirectoryExists = (filePath: string) => {
  const dirname = path.dirname(filePath)
  if (fs.existsSync(dirname)) {
    return true
  }
  fs.mkdirSync(dirname, { recursive: true })
}

// Función para leer los usuarios registrados
const getRegisteredUsers = () => {
  try {
    ensureDirectoryExists(usersFilePath)

    if (!fs.existsSync(usersFilePath)) {
      return []
    }

    const data = fs.readFileSync(usersFilePath, "utf8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Error al leer los usuarios registrados:", error)
    return []
  }
}

// Función para guardar los usuarios registrados
const saveRegisteredUsers = (users: any[]) => {
  try {
    ensureDirectoryExists(usersFilePath)
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2))
    return true
  } catch (error) {
    console.error("Error al guardar los usuarios registrados:", error)
    return false
  }
}

// Verificar autenticación
const verifyAuth = async (request: NextRequest) => {
  const token = extractTokenFromRequest(request)

  if (!token) {
    return false
  }

  return await verifyToken(token)
}

// GET: Obtener todos los usuarios registrados
export async function GET(request: NextRequest) {
  if (!(await verifyAuth(request))) {
    return NextResponse.json(
      {
        success: false,
        message: "No autorizado",
      },
      { status: 401 },
    )
  }

  const users = getRegisteredUsers()
  return NextResponse.json(users)
}

// POST: Añadir un nuevo usuario
export async function POST(request: NextRequest) {
  if (!(await verifyAuth(request))) {
    return NextResponse.json(
      {
        success: false,
        message: "No autorizado",
      },
      { status: 401 },
    )
  }

  try {
    const { email, name } = await request.json()

    if (!email || !name) {
      return NextResponse.json(
        {
          success: false,
          message: "Email y nombre son requeridos",
        },
        { status: 400 },
      )
    }

    const users = getRegisteredUsers()

    // Verificar si el usuario ya existe
    const userExists = users.some((user: any) => user.email.toLowerCase() === email.toLowerCase())

    if (userExists) {
      return NextResponse.json(
        {
          success: false,
          message: "El usuario ya está registrado",
        },
        { status: 400 },
      )
    }

    // Añadir nuevo usuario
    const newUser = {
      id: Date.now().toString(),
      email,
      name,
      registrationDate: new Date().toISOString(),
    }

    users.push(newUser)

    if (saveRegisteredUsers(users)) {
      return NextResponse.json({
        success: true,
        user: newUser,
      })
    } else {
      throw new Error("Error al guardar el usuario")
    }
  } catch (error) {
    console.error("Error al añadir usuario:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error al añadir el usuario",
      },
      { status: 500 },
    )
  }
}

// DELETE: Eliminar un usuario
export async function DELETE(request: NextRequest) {
  if (!(await verifyAuth(request))) {
    return NextResponse.json(
      {
        success: false,
        message: "No autorizado",
      },
      { status: 401 },
    )
  }

  try {
    const id = request.nextUrl.searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "ID de usuario no proporcionado",
        },
        { status: 400 },
      )
    }

    let users = getRegisteredUsers()

    // Verificar si el usuario existe
    const userExists = users.some((user: any) => user.id === id)

    if (!userExists) {
      return NextResponse.json(
        {
          success: false,
          message: "Usuario no encontrado",
        },
        { status: 404 },
      )
    }

    // Eliminar usuario
    users = users.filter((user: any) => user.id !== id)

    if (saveRegisteredUsers(users)) {
      return NextResponse.json({
        success: true,
        message: "Usuario eliminado correctamente",
      })
    } else {
      throw new Error("Error al eliminar el usuario")
    }
  } catch (error) {
    console.error("Error al eliminar usuario:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error al eliminar el usuario",
      },
      { status: 500 },
    )
  }
}
