"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertCircle, RefreshCw, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/user-context"
import Link from "next/link"

export default function VerifyPage() {
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isRequestingCode, setIsRequestingCode] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const { toast } = useToast()
  const { login } = useUser()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Obtener email de los parámetros de URL si existe
    const emailParam = searchParams.get("email")
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  const handleVerify = async () => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Por favor, ingresa tu correo electrónico",
        variant: "destructive",
      })
      return
    }

    if (!code.trim()) {
      toast({
        title: "Error",
        description: "Por favor, ingresa el código de verificación",
        variant: "destructive",
      })
      return
    }

    setIsVerifying(true)
    setVerificationStatus("idle")
    setErrorMessage("")

    try {
      // Usar el endpoint para verificar el código
      const response = await fetch("/api/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code }),
      })

      const data = await response.json()
      console.log("Respuesta de verificación:", data)

      if (data.success) {
        setVerificationStatus("success")
        toast({
          title: "¡Verificación exitosa!",
          description: "Tu cuenta ha sido verificada correctamente.",
        })

        // Guardar el estado de verificación en localStorage y sessionStorage
        localStorage.setItem("userEmail", email)
        localStorage.setItem("userVerified", "true")
        const expiryTime = Date.now() + 30 * 24 * 60 * 60 * 1000
        localStorage.setItem("loginExpiry", expiryTime.toString())

        // También guardar en sessionStorage para mayor persistencia
        sessionStorage.setItem("userEmail", email)
        sessionStorage.setItem("userVerified", "true")
        sessionStorage.setItem("loginExpiry", expiryTime.toString())

        // Iniciar sesión con el contexto de usuario
        login(email)

        // Intentar actualizar el estado del usuario en la base de datos
        try {
          await fetch("/api/update-verification", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
          })
        } catch (updateError) {
          console.error("Error al actualizar estado de verificación:", updateError)
          // No mostrar error al usuario, ya que la verificación fue exitosa
        }
      } else {
        setVerificationStatus("error")
        setErrorMessage(data.message || "Error al verificar el código")
        toast({
          title: "Error",
          description: data.message || "Error al verificar el código",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error de conexión:", error)
      setVerificationStatus("error")
      setErrorMessage("Error de conexión. Por favor, intenta nuevamente.")
      toast({
        title: "Error",
        description: "Error de conexión. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleRequestCode = async () => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Por favor, ingresa tu correo electrónico",
        variant: "destructive",
      })
      return
    }

    setIsRequestingCode(true)
    setErrorMessage("")
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    console.log(`[VERIFY-PAGE] [${requestId}] Solicitando código para: ${email}`)

    try {
      const response = await fetch("/api/send-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          email,
          name: email.split("@")[0], // Extraer nombre del email como fallback
        }),
      })

      console.log(`[VERIFY-PAGE] [${requestId}] Respuesta recibida: ${response.status}`)
      const data = await response.json()
      console.log(`[VERIFY-PAGE] [${requestId}] Datos recibidos:`, data)

      if (data.success) {
        console.log(`[VERIFY-PAGE] [${requestId}] Código enviado exitosamente`)
        toast({
          title: "Código enviado",
          description: "Se ha enviado un nuevo código de verificación a tu correo electrónico.",
        })

        // Si estamos en desarrollo y hay un código de prueba, mostrarlo
        if (data.testCode) {
          console.log(`[VERIFY-PAGE] [${requestId}] Mostrando código de prueba: ${data.testCode}`)
          toast({
            title: "Código de prueba",
            description: `Código: ${data.testCode}`,
            variant: "default",
          })
        }
      } else {
        console.log(`[VERIFY-PAGE] [${requestId}] Error al enviar código: ${data.message}`)
        setErrorMessage(data.message || "Error al solicitar el código")
        toast({
          title: "Error",
          description: data.message || "Error al solicitar el código",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(`[VERIFY-PAGE] [${requestId}] Error al solicitar código:`, error)
      setErrorMessage("Error de conexión. Por favor, intenta nuevamente.")
      toast({
        title: "Error",
        description: "Error de conexión. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsRequestingCode(false)
    }
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Verificación de Cuenta</CardTitle>
            <CardDescription className="text-center">
              Ingresa el código de verificación que recibiste por correo electrónico
            </CardDescription>
          </CardHeader>
          <CardContent>
            {verificationStatus === "success" ? (
              <div className="text-center py-6">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-700 mb-2">¡Verificación Exitosa!</h3>
                <p className="text-gray-600 mb-4">
                  Tu cuenta ha sido verificada correctamente. Ahora puedes acceder a nuestra tasa preferencial.
                </p>
                <Button asChild className="bg-amber-500 hover:bg-amber-600">
                  <Link href="/">Ir al Inicio</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Correo Electrónico
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    disabled={isVerifying}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="code" className="text-sm font-medium">
                    Código de Verificación
                  </label>
                  <Input
                    id="code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Ingresa el código de 6 dígitos"
                    maxLength={6}
                    disabled={isVerifying}
                  />
                </div>

                {errorMessage && (
                  <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Error</p>
                      <p>{errorMessage}</p>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleVerify}
                  className="w-full bg-amber-500 hover:bg-amber-600"
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    "Verificar Código"
                  )}
                </Button>

                <div className="text-center pt-2">
                  <Button
                    variant="link"
                    onClick={handleRequestCode}
                    disabled={isRequestingCode}
                    className="text-amber-600"
                  >
                    {isRequestingCode ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Solicitar nuevo código
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-4">
            <p className="text-sm text-gray-500">
              ¿No has recibido el código? Revisa tu carpeta de spam o{" "}
              <Button variant="link" onClick={handleRequestCode} disabled={isRequestingCode} className="p-0 h-auto">
                solicita uno nuevo
              </Button>
              .
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
