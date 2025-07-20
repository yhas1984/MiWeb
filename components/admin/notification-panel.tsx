"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import type { Notification } from "@/models/notification"
// Importación correcta de los iconos
import { Bell, CheckCircle, Trash2, RefreshCw, User, ShieldAlert } from "lucide-react"

export function NotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/notifications", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      setNotifications(data)
    } catch (error) {
      console.error("Error al obtener notificaciones:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las notificaciones",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()

    // Actualizar notificaciones cada 60 segundos
    const interval = setInterval(fetchNotifications, 60000)

    return () => clearInterval(interval)
  }, [])

  const markAsRead = async (id?: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({
          action: "markAsRead",
          id,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        if (id) {
          setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
        } else {
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }

        toast({
          title: "Éxito",
          description: id ? "Notificación marcada como leída" : "Todas las notificaciones marcadas como leídas",
        })
      }
    } catch (error) {
      console.error("Error al marcar notificación:", error)
      toast({
        title: "Error",
        description: "No se pudo marcar la notificación como leída",
        variant: "destructive",
      })
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({
          action: "delete",
          id,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
        toast({
          title: "Éxito",
          description: "Notificación eliminada",
        })
      }
    } catch (error) {
      console.error("Error al eliminar notificación:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la notificación",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "registration":
        return <User className="h-5 w-5 text-blue-500" />
      case "verification":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "system":
        return <ShieldAlert className="h-5 w-5 text-amber-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "registration":
        return <Badge className="bg-blue-100 text-blue-800">Registro</Badge>
      case "verification":
        return <Badge className="bg-green-100 text-green-800">Verificación</Badge>
      case "system":
        return <Badge className="bg-amber-100 text-amber-800">Sistema</Badge>
      default:
        return <Badge>Otro</Badge>
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl">
            Notificaciones
            {unreadCount > 0 && <Badge className="ml-2 bg-red-500">{unreadCount}</Badge>}
          </CardTitle>
          <CardDescription>Recibe alertas sobre nuevos registros y verificaciones</CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => fetchNotifications()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAsRead()}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Marcar todas como leídas
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Cargando notificaciones...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No hay notificaciones disponibles</div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${notification.read ? "bg-white" : "bg-blue-50 border-blue-200"}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5">{getTypeIcon(notification.type)}</div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{notification.title}</h4>
                        {getTypeBadge(notification.type)}
                        {!notification.read && <Badge className="bg-blue-500">Nueva</Badge>}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <div className="text-xs text-gray-500 mt-2">{formatDate(notification.createdAt)}</div>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => markAsRead(notification.id)}
                        className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteNotification(notification.id)}
                      className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
