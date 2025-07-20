"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, RefreshCw } from "lucide-react"
import Link from "next/link"
import { LastUpdated } from "@/components/last-updated"
import { useUser } from "@/contexts/user-context"
import { ClientOnly } from "@/lib/client-only"
import { Input } from "@/components/ui/input"
import { CardDescription } from "@/components/ui/card"
import { Lock, UserCheck, UserX } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { saveRates } from "@/lib/rates-service"

interface ExchangeRateProps {
  initialRate?: number
}

export function ExchangeRate({ initialRate = 72 }: ExchangeRateProps) {
  const [rate, setRate] = useState<number>(initialRate)
  const [lastUpdated, setLastUpdated] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const { isLoggedIn, isVerified: userIsVerified } = useUser()
  const [standardRate, setStandardRate] = useState<number>(72)
  const [premiumRate, setPremiumRate] = useState<number>(initialRate)
  const [newRate, setNewRate] = useState<string>("")
  const [newStandardRate, setNewStandardRate] = useState<string>("")
  const [newPremiumRate, setNewPremiumRate] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [isUpdating, setIsUpdating] = useState<boolean>(false)
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
  const [isRegistered, setIsRegistered] = useState<boolean>(false)
  const [email, setEmail] = useState<string>("")
  const [isCheckingRegistration, setIsCheckingRegistration] = useState<boolean>(false)
  const [isUpdatingVerification, setIsUpdatingVerification] = useState<boolean>(false)
  const { toast } = useToast()
  const { isAuthenticated, token, login } = useAuth()
  const { userEmail, login: userLogin } = useUser()
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState<boolean>(false)
  const [initialLoadDone, setInitialLoadDone] = useState<boolean>(false)
  const [isVerified, setIsVerified] = useState<boolean>(userIsVerified)

  // Añadir un ref para evitar múltiples solicitudes
  const fetchingRatesRef = useRef(false)
  const requestingCodeRef = useRef(false)
  const checkingRegistrationRef = useRef(false)

  useEffect(() => {
    setIsMounted(true)
    setLastUpdated(new Date().toISOString())
  }, [])

  useEffect(() => {
    if (isMounted) {
      fetchRates()

      // Escuchar eventos de actualización de tasas
      const handleRatesUpdated = (event: CustomEvent) => {
        if (event.detail) {
          // Verificar si el usuario está logueado o verificado
          const userVerified = isLoggedIn || isVerified
          const newRate = userVerified ? Number(event.detail.premiumRate) : Number(event.detail.standardRate)
          const newLastUpdated = event.detail.lastUpdated

          if (!isNaN(newRate) && newRate > 0) {
            setRate(newRate)
            setPremiumRate(Number(event.detail.premiumRate))
            setStandardRate(Number(event.detail.standardRate))
          }

          if (newLastUpdated) {
            setLastUpdated(newLastUpdated)
          }
        }
      }

      window.addEventListener("ratesUpdated", handleRatesUpdated as EventListener)

      return () => {
        window.removeEventListener("ratesUpdated", handleRatesUpdated as EventListener)
      }
    }
  }, [isMounted, isVerified, isLoggedIn])

  // Cargar estado de usuario al iniciar
  useEffect(() => {
    // Si el usuario está logueado, actualizar el estado
    if (isLoggedIn && userEmail) {
      setEmail(userEmail)
      setIsRegistered(true)
      setIsVerified(true)
    }
  }, [isLoggedIn, userEmail])

  const fetchRates = async () => {
    // Evitar múltiples solicitudes simultáneas
    if (fetchingRatesRef.current) {
      console.log("[EXCHANGE-RATE] Evitando solicitud duplicada de tasas")
      return
    }

    fetchingRatesRef.current = true
    setIsLoading(true)

    try {
      console.log("[EXCHANGE-RATE] Iniciando solicitud de tasas")
      // Intentar obtener las tasas más recientes del servidor primero
      const response = await fetch("/api/exchange-rate", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
        },
        cache: "no-store",
      })

      if (response.ok) {
        const data = await response.json()
        console.log("[EXCHANGE-RATE] Tasas recibidas:", data)

        // Convertir a números para asegurar el formato correcto
        const standardRateValue = Number(data.standardRate)
        const premiumRateValue = Number(data.premiumRate)

        // Actualizar tasas si son válidas
        if (!isNaN(standardRateValue) && standardRateValue > 0) {
          setStandardRate(standardRateValue)
        }

        if (!isNaN(premiumRateValue) && premiumRateValue > 0) {
          setPremiumRate(premiumRateValue)
        }

        // Actualizar la tasa mostrada según el estado de verificación del usuario
        const userVerified = isLoggedIn || isVerified
        const rateValue = userVerified ? premiumRateValue : standardRateValue
        if (!isNaN(rateValue) && rateValue > 0) {
          setRate(rateValue)
        }

        // Actualizar la fecha de última actualización
        if (data.lastUpdated) {
          setLastUpdated(data.lastUpdated)
        }

        // Guardar en localStorage para uso offline
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "tuenvioexpress_rates",
            JSON.stringify({
              standardRate: standardRateValue,
              premiumRate: premiumRateValue,
              lastUpdated: data.lastUpdated || new Date().toISOString(),
            }),
          )
        }
      } else {
        console.log("[EXCHANGE-RATE] Error al obtener tasas:", response.status)
        // Si la API falla, intentar cargar desde localStorage como respaldo
        if (typeof window !== "undefined") {
          const savedRates = localStorage.getItem("tuenvioexpress_rates")
          if (savedRates) {
            const rates = JSON.parse(savedRates)
            const rateValue = isVerified ? Number(rates.premiumRate) : Number(rates.standardRate)

            if (!isNaN(rateValue) && rateValue > 0) {
              setRate(rateValue)
            }

            if (rates.lastUpdated) {
              setLastUpdated(rates.lastUpdated)
            }
          }
        }
      }
    } catch (error) {
      console.error("[EXCHANGE-RATE] Error al obtener las tasas:", error)

      // En caso de error, intentar cargar desde localStorage como respaldo
      if (typeof window !== "undefined") {
        const savedRates = localStorage.getItem("tuenvioexpress_rates")
        if (savedRates) {
          const rates = JSON.parse(savedRates)
          const rateValue = isVerified ? Number(rates.premiumRate) : Number(rates.standardRate)

          if (!isNaN(rateValue) && rateValue > 0) {
            setRate(rateValue)
          }

          if (rates.lastUpdated) {
            setLastUpdated(rates.lastUpdated)
          }
        }
      }
    } finally {
      setIsLoading(false)
      // Importante: restablecer el flag después de completar la solicitud
      setTimeout(() => {
        fetchingRatesRef.current = false
        console.log("[EXCHANGE-RATE] Flag de solicitud de tasas restablecido")
      }, 1000) // Pequeño retraso para evitar solicitudes rápidas consecutivas
    }
  }

  const handleLogin = async () => {
    if (!password) {
      toast({
        title: "Error",
        description: "Por favor, ingresa la contraseña",
        variant: "destructive",
      })
      return
    }

    const success = await login(password)
    if (success) {
      setIsLoginDialogOpen(false)
      setPassword("")
    }
  }

  const handleUpdateRate = async () => {
    // Siempre mostrar el diálogo de inicio de sesión primero, independientemente del estado de autenticación
    if (!isAuthenticated || !token) {
      setIsLoginDialogOpen(true)
      return
    }

    // Validar los datos de entrada
    if (!newStandardRate || !newPremiumRate) {
      toast({
        title: "Error",
        description: "Por favor, ingresa ambas tasas",
        variant: "destructive",
      })
      return
    }

    // Validar que sean números válidos
    const standardRateNum = Number(newStandardRate)
    const premiumRateNum = Number(newPremiumRate)

    if (isNaN(standardRateNum) || isNaN(premiumRateNum) || standardRateNum <= 0 || premiumRateNum <= 0) {
      toast({
        title: "Error",
        description: "Las tasas deben ser números positivos",
        variant: "destructive",
      })
      return
    }

    // Validar que la tasa premium sea mayor que la estándar
    if (premiumRateNum <= standardRateNum) {
      toast({
        title: "Error",
        description: "La tasa premium debe ser mayor que la tasa estándar",
        variant: "destructive",
      })
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch("/api/exchange-rate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          standardRate: standardRateNum,
          premiumRate: premiumRateNum,
        }),
      })

      if (!response.ok) {
        // Si el error es de autenticación, mostrar el diálogo de inicio de sesión
        if (response.status === 401) {
          setIsLoginDialogOpen(true)
          throw new Error("No autorizado. Por favor, inicia sesión nuevamente.")
        }
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        // Actualizar tasas locales
        setStandardRate(standardRateNum)
        setPremiumRate(premiumRateNum)
        setRate(isVerified || isLoggedIn ? premiumRateNum : standardRateNum)

        const newLastUpdated = new Date().toISOString()
        setLastUpdated(newLastUpdated)

        // Guardar en localStorage
        const ratesData = {
          standardRate: standardRateNum,
          premiumRate: premiumRateNum,
          lastUpdated: newLastUpdated,
        }

        saveRates(ratesData)

        // Limpiar formulario y cerrar diálogo
        setIsDialogOpen(false)
        setNewStandardRate("")
        setNewPremiumRate("")

        toast({
          title: "Tasas actualizadas",
          description: `Las tasas se han actualizado correctamente.`,
        })
      } else {
        throw new Error(data.message || "No se pudo actualizar la tasa")
      }
    } catch (error) {
      console.error("Error al actualizar la tasa:", error)

      // Si el error es de autenticación, mostrar el diálogo de inicio de sesión
      if (error.message?.includes("401") || error.message?.includes("autorizado") || error.message?.includes("token")) {
        setIsLoginDialogOpen(true)
        toast({
          title: "Sesión expirada",
          description: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error al actualizar la tasa",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const checkRegistration = async () => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Por favor, ingresa tu correo electrónico",
        variant: "destructive",
      })
      return
    }

    // Evitar múltiples solicitudes simultáneas
    if (checkingRegistrationRef.current) {
      console.log("[EXCHANGE-RATE] Evitando verificación duplicada para:", email)
      return
    }

    checkingRegistrationRef.current = true
    setIsCheckingRegistration(true)

    const checkId = `check-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    console.log(`[EXCHANGE-RATE] [${checkId}] Verificando registro para: ${email}`)

    try {
      const response = await fetch("/api/check-registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store",
        },
        body: JSON.stringify({ email }),
      })

      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        console.error(`[EXCHANGE-RATE] [${checkId}] Error HTTP: ${response.status} ${response.statusText}`)

        // Intentar leer el texto de la respuesta para obtener más información
        const errorText = await response.text()
        console.error(`[EXCHANGE-RATE] [${checkId}] Respuesta de error: ${errorText.substring(0, 200)}`)

        toast({
          title: "Error del servidor",
          description: `Error ${response.status}: No se pudo verificar el registro`,
          variant: "destructive",
        })
        return
      }

      // Verificar que la respuesta sea JSON válido
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text()
        console.error(`[EXCHANGE-RATE] [${checkId}] Respuesta no es JSON: ${responseText.substring(0, 200)}`)

        toast({
          title: "Error",
          description: "El servidor devolvió una respuesta inválida",
          variant: "destructive",
        })
        return
      }

      const data = await response.json()
      console.log(`[EXCHANGE-RATE] [${checkId}] Respuesta de verificación:`, data)

      // Verificar si la respuesta tiene la estructura esperada
      if (typeof data.isRegistered === "undefined") {
        console.error(`[EXCHANGE-RATE] [${checkId}] Respuesta malformada:`, data)
        toast({
          title: "Error",
          description: "Respuesta del servidor malformada",
          variant: "destructive",
        })
        return
      }

      // Si el usuario no está registrado, registrarlo automáticamente
      if (!data.isRegistered) {
        console.log(`[EXCHANGE-RATE] [${checkId}] Usuario no registrado, registrando automáticamente...`)
        const registerResult = await registerUser(email)
        if (registerResult) {
          // Si el registro fue exitoso, solicitar verificación
          if (confirm("¿Deseas solicitar un código de verificación para activar tu cuenta?")) {
            console.log(`[EXCHANGE-RATE] [${checkId}] Usuario confirmó solicitud de código`)
            await requestVerificationCode(email)
          } else {
            console.log(`[EXCHANGE-RATE] [${checkId}] Usuario canceló solicitud de código`)
          }
        }
        return
      }

      // Actualizar el estado basado en la respuesta
      setIsRegistered(data.isRegistered)
      setIsVerified(data.verified)
      console.log(
        `[EXCHANGE-RATE] [${checkId}] Estado actualizado: registrado=${data.isRegistered}, verificado=${data.verified}`,
      )

      // Si el usuario está verificado, iniciar sesión automáticamente
      if (data.verified) {
        userLogin(email)
        console.log(`[EXCHANGE-RATE] [${checkId}] Usuario verificado, iniciando sesión automáticamente`)
        toast({
          title: "Inicio de sesión exitoso",
          description: "Has iniciado sesión con tu cuenta verificada.",
        })
      } else if (data.isRegistered) {
        // Solo si el usuario está registrado pero no verificado, preguntar por verificación
        console.log(`[EXCHANGE-RATE] [${checkId}] Usuario registrado pero no verificado`)
        toast({
          title: "Usuario registrado pero no verificado",
          description: "Por favor, verifica tu cuenta para acceder a nuestra tasa preferencial.",
          variant: "destructive",
        })

        // Preguntar si quiere solicitar un nuevo código
        if (confirm("¿Deseas solicitar un código de verificación para activar tu cuenta?")) {
          console.log(`[EXCHANGE-RATE] [${checkId}] Usuario confirmó solicitud de código`)
          await requestVerificationCode(email)
        } else {
          console.log(`[EXCHANGE-RATE] [${checkId}] Usuario canceló solicitud de código`)
        }
      }
    } catch (error) {
      console.error(`[EXCHANGE-RATE] [${checkId}] Error al verificar registro:`, error)

      // Manejar diferentes tipos de errores
      let errorMessage = "Ocurrió un error al verificar el registro"

      if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
        errorMessage = "Error de conexión. Verifica tu conexión a internet."
      } else if (error instanceof SyntaxError && error.message.includes("JSON")) {
        errorMessage = "Error al procesar la respuesta del servidor. El servidor puede estar experimentando problemas."
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      setIsRegistered(false)
      setIsVerified(false)
    } finally {
      setIsCheckingRegistration(false)
      // Importante: restablecer el flag después de completar la solicitud
      setTimeout(() => {
        checkingRegistrationRef.current = false
        console.log(`[EXCHANGE-RATE] [${checkId}] Flag de verificación restablecido`)
      }, 1000) // Pequeño retraso para evitar solicitudes rápidas consecutivas
    }
  }

  const registerUser = async (email: string): Promise<boolean> => {
    try {
      console.log(`Registrando usuario: ${email}`)
      const response = await fetch("/api/register-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          name: email.split("@")[0], // Extraer nombre del email como fallback
        }),
      })

      // Verificar si la respuesta es exitosa antes de parsear JSON
      if (!response.ok) {
        console.error(`Error HTTP: ${response.status} ${response.statusText}`)

        // Intentar leer el texto de la respuesta para obtener más información
        const errorText = await response.text()
        console.error(`Respuesta de error: ${errorText}`)

        toast({
          title: "Error",
          description: `Error del servidor: ${response.status}. ${errorText.substring(0, 100)}`,
          variant: "destructive",
        })
        return false
      }

      // Verificar que la respuesta sea JSON válido
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text()
        console.error(`Respuesta no es JSON: ${responseText}`)

        toast({
          title: "Error",
          description: "El servidor devolvió una respuesta inválida",
          variant: "destructive",
        })
        return false
      }

      const data = await response.json()
      console.log(`Respuesta de registro:`, data)

      if (data.success) {
        setIsRegistered(true)
        setIsVerified(false)

        toast({
          title: "Usuario registrado",
          description: "Te has registrado correctamente. Ahora puedes verificar tu cuenta.",
        })
        return true
      } else {
        toast({
          title: "Error",
          description: data.message || "No se pudo registrar el usuario",
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      console.error("Error al registrar usuario:", error)

      // Manejar diferentes tipos de errores
      let errorMessage = "Ocurrió un error al registrar el usuario"

      if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
        errorMessage = "Error de conexión. Verifica tu conexión a internet."
      } else if (error instanceof SyntaxError && error.message.includes("JSON")) {
        errorMessage = "Error al procesar la respuesta del servidor"
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      return false
    }
  }

  const requestVerificationCode = async (email: string): Promise<boolean> => {
    // Evitar múltiples solicitudes simultáneas
    if (requestingCodeRef.current) {
      console.log("[EXCHANGE-RATE] Evitando solicitud duplicada de código para:", email)
      return false
    }

    requestingCodeRef.current = true

    const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    console.log(`[EXCHANGE-RATE] [${requestId}] Solicitando código para: ${email}`)

    try {
      const response = await fetch("/api/send-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Añadir un header único para evitar duplicación
          "X-Request-ID": requestId,
        },
        body: JSON.stringify({
          email,
          name: email.split("@")[0], // Extraer nombre del email como fallback
        }),
      })

      const data = await response.json()
      console.log(`[EXCHANGE-RATE] [${requestId}] Respuesta de solicitud de código:`, data)

      if (data.success) {
        console.log(`[EXCHANGE-RATE] [${requestId}] Código enviado exitosamente`)
        toast({
          title: "Código enviado",
          description: "Se ha enviado un nuevo código de verificación a tu correo electrónico.",
        })

        // Redirigir a la página de verificación
        console.log(`[EXCHANGE-RATE] [${requestId}] Redirigiendo a página de verificación`)
        window.location.href = `/verificar?email=${encodeURIComponent(email)}`
        return true
      } else {
        console.log(`[EXCHANGE-RATE] [${requestId}] Error al enviar código: ${data.message}`)
        toast({
          title: "Error",
          description: data.message || "No se pudo enviar el código de verificación",
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      console.error(`[EXCHANGE-RATE] [${requestId}] Error al solicitar código:`, error)
      toast({
        title: "Error",
        description: "Ocurrió un error al solicitar el código de verificación",
        variant: "destructive",
      })
      return false
    } finally {
      // Importante: restablecer el flag después de completar la solicitud
      setTimeout(() => {
        requestingCodeRef.current = false
        console.log(`[EXCHANGE-RATE] [${requestId}] Flag de solicitud de código restablecido`)
      }, 2000) // Retraso más largo para evitar solicitudes rápidas consecutivas
    }
  }

  const forceUpdateVerification = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Por favor, ingresa tu correo electrónico primero",
        variant: "destructive",
      })
      return
    }

    setIsUpdatingVerification(true)
    try {
      console.log(`Forzando actualización de estado de verificación para: ${email}`)

      // Llamar al nuevo endpoint para actualizar el estado de verificación
      const response = await fetch("/api/update-verification-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          verified: true,
        }),
      })

      const data = await response.json()
      console.log("Respuesta de actualización de verificación:", data)

      if (data.success) {
        // Actualizar el estado local
        setIsRegistered(true)
        setIsVerified(true)

        // Iniciar sesión con el contexto de usuario
        userLogin(email)

        toast({
          title: "Estado actualizado",
          description: "Tu cuenta ha sido verificada correctamente.",
        })
      } else {
        throw new Error(data.message || "No se pudo actualizar el estado de verificación")
      }
    } catch (error) {
      console.error("Error al actualizar estado de verificación:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar el estado de verificación",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingVerification(false)
    }
  }

  // Verificar automáticamente si hay un email guardado en localStorage
  useEffect(() => {
    // Si el usuario ya está logueado, usar ese email
    if (isLoggedIn && userEmail) {
      setEmail(userEmail)
      setIsRegistered(true)
      setIsVerified(true)
      return
    }

    // Si no, verificar si hay un email guardado en localStorage
    const savedEmail = localStorage.getItem("userEmail")
    const savedVerified = localStorage.getItem("userVerified") === "true"

    if (savedEmail) {
      setEmail(savedEmail)
      setIsRegistered(true)
      setIsVerified(savedVerified)

      // Verificar automáticamente el estado de registro
      const autoCheck = async () => {
        try {
          console.log("Verificando automáticamente registro para:", savedEmail)
          const response = await fetch("/api/check-registration", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache, no-store",
            },
            body: JSON.stringify({ email: savedEmail }),
          })

          const data = await response.json()
          console.log("Respuesta de verificación automática:", data)

          // Actualizar el estado basado en la respuesta
          setIsRegistered(data.isRegistered)
          setIsVerified(data.verified)

          // Si el usuario está verificado, iniciar sesión
          if (data.verified) {
            userLogin(savedEmail)
          }
        } catch (error) {
          console.error("Error al verificar registro automáticamente:", error)
        }
      }

      autoCheck()
    }
  }, [isLoggedIn, userEmail, userLogin])

  // Si el componente no está montado, mostrar un estado de carga para evitar problemas de hidratación
  if (!isMounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Tasa de Cambio</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-amber-500 mr-2" />
            <span>Cargando tasas...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-md mx-auto shadow-lg border-amber-200">
      <CardHeader className="bg-gradient-to-r from-amber-500 to-amber-400 text-white">
        <CardTitle className="text-center text-2xl">Tasa del Día</CardTitle>
        <CardDescription className="text-white/90 text-center">EUR/VES</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-6">
        <div className="text-4xl font-bold mb-2 flex items-center">
          <span className={isVerified || isLoggedIn ? "text-green-600" : "text-amber-500"}>1 EUR</span>
          <ArrowRight className="mx-2 h-6 w-6 text-gray-400" />
          <ClientOnly>
            {() => <span className={isVerified || isLoggedIn ? "text-green-600" : "text-amber-600"}>{rate} VES</span>}
          </ClientOnly>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          {isVerified || isLoggedIn ? (
            <span className="text-green-600 font-medium">Tasa Premium (Usuario verificado)</span>
          ) : (
            <span>Tasa estándar para usuarios no registrados</span>
          )}
        </p>

        {!isLoggedIn && (
          <Button asChild className="bg-amber-500 hover:bg-amber-600">
            <Link href="/registro">Registrarme para obtener mejor tasa</Link>
          </Button>
        )}

        <LastUpdated lastUpdated={lastUpdated} isLoading={isLoading} />

        <div className="mt-6 border-t pt-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-center">¿Ya estás registrado?</h3>
            {!isLoggedIn && (
              <div className="flex space-x-2">
                <Input
                  type="email"
                  placeholder="Ingresa tu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={checkRegistration}
                  disabled={isCheckingRegistration}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  {isCheckingRegistration ? "Verificando..." : "Verificar"}
                </Button>
              </div>
            )}

            {isLoggedIn ? (
              <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm flex items-start">
                <UserCheck className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">¡Usuario verificado!</p>
                  <p>Tienes acceso a nuestra tasa premium de {premiumRate} VES por 1 EUR.</p>
                  <p className="text-xs mt-1">Conectado como: {userEmail}</p>
                </div>
              </div>
            ) : isRegistered && isVerified ? (
              <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm flex items-start">
                <UserCheck className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">¡Usuario verificado!</p>
                  <p>Tienes acceso a nuestra tasa premium de {premiumRate} VES por 1 EUR.</p>
                </div>
              </div>
            ) : isRegistered && !isVerified ? (
              <div className="bg-amber-50 text-amber-700 p-3 rounded-md text-sm flex items-start">
                <UserX className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Usuario registrado pero no verificado</p>
                  <p>Verifica tu cuenta para obtener acceso a nuestra tasa premium.</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Button
                      onClick={() => requestVerificationCode(email)}
                      variant="link"
                      className="p-0 h-auto text-amber-700 underline"
                    >
                      Solicitar código de verificación
                    </Button>
                    <Button
                      onClick={forceUpdateVerification}
                      variant="link"
                      className="p-0 h-auto text-amber-700 underline"
                      disabled={isUpdatingVerification}
                    >
                      {isUpdatingVerification ? "Actualizando..." : "Actualizar estado"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 text-amber-700 p-3 rounded-md text-sm flex items-start">
                <UserX className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Usuario no registrado</p>
                  <p>Regístrate para obtener una mejor tasa de cambio.</p>
                  <Button
                    onClick={() => checkRegistration()}
                    variant="link"
                    className="p-0 h-auto text-amber-700 underline mt-1"
                  >
                    Registrarme ahora
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Autenticación de Administrador</DialogTitle>
              <DialogDescription>Ingresa tu contraseña para continuar</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="admin-password">Contraseña</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                />
              </div>
              <Button onClick={handleLogin} className="w-full bg-amber-500 hover:bg-amber-600" disabled={isUpdating}>
                {isUpdating ? "Verificando..." : "Acceder"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="mt-6 w-full border-amber-400 text-amber-600 hover:bg-amber-50 bg-transparent"
            >
              <Lock className="h-4 w-4 mr-2" />
              Administrar Tasas
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Actualizar Tasas de Cambio</DialogTitle>
              <DialogDescription>Ingresa las nuevas tasas de cambio.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="standardRate">Tasa Estándar (EUR/VES)</Label>
                <Input
                  id="standardRate"
                  type="number"
                  value={newStandardRate}
                  onChange={(e) => setNewStandardRate(e.target.value)}
                  placeholder="Ej: 72.5"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="premiumRate">Tasa Premium (EUR/VES)</Label>
                <Input
                  id="premiumRate"
                  type="number"
                  value={newPremiumRate}
                  onChange={(e) => setNewPremiumRate(e.target.value)}
                  placeholder="Ej: 73.5"
                  step="0.01"
                  min="0"
                />
                <p className="text-xs text-gray-500">
                  La tasa premium debe ser mayor que la tasa estándar para incentivar el registro.
                </p>
              </div>
              <Button
                onClick={handleUpdateRate}
                className="w-full bg-amber-500 hover:bg-amber-600"
                disabled={isUpdating}
              >
                {isUpdating ? "Actualizando..." : "Actualizar Tasas"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
