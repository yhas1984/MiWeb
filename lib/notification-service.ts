import type { Notification } from "@/models/notification"
import { readJsonFromFile, safeWriteJsonToFile } from "@/lib/file-utils"
import path from "path"

// Ruta al archivo JSON de notificaciones
const notificationsFilePath = path.join(process.cwd(), "data", "notifications.json")

/**
 * Obtiene todas las notificaciones
 */
export function getNotifications(): Notification[] {
  return readJsonFromFile<Notification[]>(notificationsFilePath, [])
}

/**
 * Añade una nueva notificación
 */
export function addNotification(notification: Omit<Notification, "id" | "createdAt" | "read">): Notification {
  const notifications = getNotifications()

  const newNotification: Notification = {
    ...notification,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    read: false,
  }

  notifications.unshift(newNotification) // Añadir al principio para que las más recientes aparezcan primero

  // Limitar a 100 notificaciones para evitar que el archivo crezca demasiado
  const limitedNotifications = notifications.slice(0, 100)

  safeWriteJsonToFile(notificationsFilePath, limitedNotifications)

  return newNotification
}

/**
 * Marca una notificación como leída
 */
export function markNotificationAsRead(id: string): boolean {
  const notifications = getNotifications()
  const index = notifications.findIndex((n) => n.id === id)

  if (index === -1) return false

  notifications[index].read = true
  safeWriteJsonToFile(notificationsFilePath, notifications)

  return true
}

/**
 * Marca todas las notificaciones como leídas
 */
export function markAllNotificationsAsRead(): boolean {
  const notifications = getNotifications()

  if (notifications.length === 0) return false

  const updatedNotifications = notifications.map((n) => ({ ...n, read: true }))
  safeWriteJsonToFile(notificationsFilePath, updatedNotifications)

  return true
}

/**
 * Elimina una notificación
 */
export function deleteNotification(id: string): boolean {
  const notifications = getNotifications()
  const filteredNotifications = notifications.filter((n) => n.id !== id)

  if (filteredNotifications.length === notifications.length) return false

  safeWriteJsonToFile(notificationsFilePath, filteredNotifications)

  return true
}
