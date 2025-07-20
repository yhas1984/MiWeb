"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { useUser } from "@/contexts/user-context"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
// Importación correcta de los iconos
import { Menu, Bell, LogOut, User } from "lucide-react"

// URL del logo (actualizada para asegurar que funcione)
const LOGO_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-03-05%20at%2015.49.43-uEHU6vvrZTFLABzyO55Lhcb201Bdkx.jpeg"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { isAuthenticated } = useAuth()
  const { isLoggedIn, userEmail, logout } = useUser()
  const [unreadCount, setUnreadCount] = useState(0)

  // Obtener el número de notificaciones no leídas
  useEffect(() => {
    if (isAuthenticated) {
      const fetchUnreadCount = async () => {
        try {
          const response = await fetch("/api/notifications", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
            },
          })

          if (response.ok) {
            const notifications = await response.json()
            const count = notifications.filter((n) => !n.read).length
            setUnreadCount(count)
          }
        } catch (error) {
          console.error("Error al obtener notificaciones:", error)
        }
      }

      fetchUnreadCount()

      // Actualizar cada minuto
      const interval = setInterval(fetchUnreadCount, 60000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated])

  const navLinks = [
    { name: "Inicio", href: "/" },
    { name: "Servicios", href: "#services" },
    { name: "Sobre Nosotros", href: "#about" },
    { name: "Noticias", href: "/noticias" },
    { name: "Chat", href: "/chat" },
    { name: "Contacto", href: "#contact" },
    { name: "Configuración", href: "/admin/configuracion", adminOnly: true },
    {
      name: "Notificaciones",
      href: "/admin/notificaciones",
      adminOnly: true,
      badge: unreadCount > 0 ? unreadCount : null,
    },
  ]

  const handleLogout = () => {
    logout()
    setIsOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <div className="relative h-10 w-10 overflow-hidden rounded-full border border-gray-200">
            {/* Usar un div con background-image en lugar de Image */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${LOGO_URL})` }}
              aria-label="Tu Envio Express Logo"
            ></div>
          </div>
          <span className="hidden font-bold text-xl sm:inline-block">Tu Envio Express</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            // No mostrar enlaces de admin a usuarios normales
            if (link.adminOnly && !isAuthenticated) return null

            return (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-gray-700 transition-colors hover:text-amber-500 flex items-center"
              >
                {link.name}
                {link.badge && <Badge className="ml-1 bg-red-500 text-white">{link.badge}</Badge>}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-4">
          {isAuthenticated && unreadCount > 0 && (
            <Link href="/admin/notificaciones" className="relative md:hidden">
              <Bell className="h-5 w-5 text-gray-700" />
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs h-5 w-5 flex items-center justify-center p-0 rounded-full">
                {unreadCount}
              </Badge>
            </Link>
          )}

          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100">
                  <User className="h-4 w-4 mr-2" />
                  Logeado
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-gray-500 cursor-default">{userEmail}</DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild className="hidden md:flex bg-amber-500 hover:bg-amber-600">
              <Link href="/registro">Registro</Link>
            </Button>
          )}

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col space-y-4 mt-8">
                {navLinks.map((link) => {
                  // No mostrar enlaces de admin a usuarios normales
                  if (link.adminOnly && !isAuthenticated) return null

                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="text-lg font-medium text-gray-700 hover:text-amber-500 flex items-center"
                    >
                      {link.name}
                      {link.badge && <Badge className="ml-1 bg-red-500 text-white">{link.badge}</Badge>}
                    </Link>
                  )
                })}

                {isLoggedIn ? (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="text-sm text-gray-500">Conectado como: {userEmail}</div>
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar sesión
                    </Button>
                  </div>
                ) : (
                  <Button asChild className="mt-4 bg-amber-500 hover:bg-amber-600">
                    <Link href="/registro" onClick={() => setIsOpen(false)}>
                      Registro
                    </Link>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
