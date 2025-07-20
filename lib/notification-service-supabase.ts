import { createServerSupabaseClient } from "./supabase-client"
import type { Notification } from "@/models/notification"

const LOG_PREFIX = "[NOTIFICATION-SERVICE-SUPABASE]"

/**
 * Añade una notificación a Supabase
 */
export async function addNotificationToSupabase(
  notification: Omit<Notification, "id" | "createdAt" | "read">,
): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient()

    const { error } = await supabase.from("notifications").insert([
      {
        type: notification.type,
        title: notification.title,
        message: notification.message,
        email: notification.email,
        read: false,
      },
    ])

    if (error) {
      console.error(`${LOG_PREFIX} Error al añadir notificación a Supabase:`, error)
      return false
    }

    return true
  } catch (error) {
    console.error(`${LOG_PREFIX} Error al añadir notificación a Supabase:`, error)
    // No fallar si hay un error al añadir la notificación
    return true
  }
}

/**
 * Obtiene todas las notificaciones de Supabase
 */
export async function getNotificationsFromSupabase(): Promise<Notification[]> {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error(`${LOG_PREFIX} Error al obtener notificaciones de Supabase:`, error)
      return []
    }

    if (!data) {
      console.log(`${LOG_PREFIX} No hay notificaciones en Supabase`)
      return []
    }

    return data.map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      message: item.message,
      email: item.email,
      read: item.read,
      createdAt: item.created_at,
    }))
  } catch (error) {
    console.error(`${LOG_PREFIX} Error al obtener notificaciones de Supabase:`, error)
    return []
  }
}

/**
 * Marca todas las notificaciones como leídas en Supabase
 */
export async function markAllNotificationsAsReadInSupabase(): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient()

    const { error } = await supabase.from("notifications").update({ read: true }).eq("read", false)

    if (error) {
      console.error(`${LOG_PREFIX} Error al marcar todas las notificaciones como leídas:`, error)
      return false
    }

    return true
  } catch (error) {
    console.error(`${LOG_PREFIX} Error al marcar todas las notificaciones como leídas:`, error)
    return false
  }
}

/**
 * Marca una notificación como leída en Supabase
 */
export async function markNotificationAsReadInSupabase(id: string): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient()

    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id)

    if (error) {
      console.error(`${LOG_PREFIX} Error al marcar la notificación ${id} como leída:`, error)
      return false
    }

    return true
  } catch (error) {
    console.error(`${LOG_PREFIX} Error al marcar la notificación ${id} como leída:`, error)
    return false
  }
}

/**
 * Elimina una notificación de Supabase
 */
export async function deleteNotificationFromSupabase(id: string): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient()

    const { error } = await supabase.from("notifications").delete().eq("id", id)

    if (error) {
      console.error(`${LOG_PREFIX} Error al eliminar la notificación ${id}:`, error)
      return false
    }

    return true
  } catch (error) {
    console.error(`${LOG_PREFIX} Error al eliminar la notificación ${id}:`, error)
    return false
  }
}
