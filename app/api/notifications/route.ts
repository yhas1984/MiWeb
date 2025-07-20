import { type NextRequest, NextResponse } from "next/server"
import {
  getNotificationsFromSupabase,
  markAllNotificationsAsReadInSupabase,
  markNotificationAsReadInSupabase,
  deleteNotificationFromSupabase,
} from "@/lib/notification-service-supabase"
import { verifyToken, extractTokenFromRequest } from "@/config/auth"

// Verificar autenticación
const verifyAuth = async (request: NextRequest) => {
  const token = extractTokenFromRequest(request)
  if (!token) {
    return false
  }
  return await verifyToken(token)
}

// GET: Obtener todas las notificaciones
export async function GET(request: NextRequest) {
  // Verificar autenticación
  if (!(await verifyAuth(request))) {
    return NextResponse.json(
      {
        success: false,
        message: "No autorizado",
      },
      { status: 401 },
    )
  }

  const notifications = await getNotificationsFromSupabase()
  return NextResponse.json(notifications)
}

// POST: Marcar notificaciones como leídas
export async function POST(request: NextRequest) {
  // Verificar autenticación
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
    const { action, id } = await request.json()

    if (action === "markAsRead") {
      if (id) {
        const success = await markNotificationAsReadInSupabase(id)
        return NextResponse.json({ success })
      } else {
        const success = await markAllNotificationsAsReadInSupabase()
        return NextResponse.json({ success })
      }
    } else if (action === "delete") {
      if (!id) {
        return NextResponse.json(
          {
            success: false,
            message: "ID de notificación no proporcionado",
          },
          { status: 400 },
        )
      }

      const success = await deleteNotificationFromSupabase(id)
      return NextResponse.json({ success })
    }

    return NextResponse.json(
      {
        success: false,
        message: "Acción no válida",
      },
      { status: 400 },
    )
  } catch (error) {
    console.error("Error al procesar la solicitud:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error al procesar la solicitud",
      },
      { status: 500 },
    )
  }
}
