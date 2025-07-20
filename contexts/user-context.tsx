"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"

interface UserContextType {
  isLoggedIn: boolean
  userEmail: string | null
  login: (email: string) => void
  logout: () => void
  checkLoginStatus: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const { toast } = useToast()

  // Check login status on mount
  useEffect(() => {
    checkLoginStatus()
  }, [])

  const checkLoginStatus = () => {
    try {
      // Intentar obtener datos de localStorage primero
      let storedEmail = localStorage.getItem("userEmail")
      let storedVerified = localStorage.getItem("userVerified") === "true"
      let loginExpiry = localStorage.getItem("loginExpiry")

      // Si no hay datos en localStorage, intentar con sessionStorage
      if (!storedEmail || !loginExpiry) {
        storedEmail = sessionStorage.getItem("userEmail")
        storedVerified = sessionStorage.getItem("userVerified") === "true"
        loginExpiry = sessionStorage.getItem("loginExpiry")
      }

      // Check if login is still valid
      if (storedEmail && loginExpiry) {
        const expiryTime = Number.parseInt(loginExpiry, 10)

        // If login hasn't expired yet
        if (expiryTime > Date.now()) {
          setIsLoggedIn(true)
          setUserEmail(storedEmail)

          // Verificar con el servidor si el usuario está verificado
          fetch("/api/check-registration", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: storedEmail }),
          })
            .then((response) => response.json())
            .then((data) => {
              if (data.verified) {
                // Actualizar localStorage y sessionStorage
                localStorage.setItem("userVerified", "true")
                sessionStorage.setItem("userVerified", "true")
              }
            })
            .catch((error) => {
              console.error("Error al verificar estado:", error)
            })

          return
        }
      }

      // If we get here, either no login data or expired
      setIsLoggedIn(false)
      setUserEmail(null)
    } catch (error) {
      console.error("Error checking login status:", error)
      setIsLoggedIn(false)
      setUserEmail(null)
    }
  }

  const login = (email: string) => {
    try {
      // Set login expiry to 30 days from now
      const expiryTime = Date.now() + 30 * 24 * 60 * 60 * 1000

      localStorage.setItem("userEmail", email)
      localStorage.setItem("userVerified", "true")
      localStorage.setItem("loginExpiry", expiryTime.toString())

      // Guardar en sessionStorage también para mayor persistencia entre pestañas
      sessionStorage.setItem("userEmail", email)
      sessionStorage.setItem("userVerified", "true")
      sessionStorage.setItem("loginExpiry", expiryTime.toString())

      setIsLoggedIn(true)
      setUserEmail(email)

      // Evitar mostrar toast durante pruebas automáticas
      if (!window.autoLoginTesting) {
        toast({
          title: "Sesión iniciada",
          description: "Has iniciado sesión correctamente.",
        })
      }
    } catch (error) {
      console.error("Error during login:", error)
      toast({
        title: "Error",
        description: "No se pudo iniciar sesión.",
        variant: "destructive",
      })
    }
  }

  const logout = () => {
    try {
      // Remove verification status but keep email for convenience
      localStorage.removeItem("userVerified")
      localStorage.removeItem("loginExpiry")

      setIsLoggedIn(false)
      setUserEmail(null)

      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente.",
      })
    } catch (error) {
      console.error("Error during logout:", error)
    }
  }

  return (
    <UserContext.Provider value={{ isLoggedIn, userEmail, login, logout, checkLoginStatus }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
