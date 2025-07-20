"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function ManualVerification() {
  const [email, setEmail] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const { toast } = useToast()

  const handleVerify = async () => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Por favor, ingresa un correo electrónico",
        variant: "destructive",
      })
      return
    }

    setIsVerifying(true)
    try {
      // Primero intentamos registrar al usuario si no existe
      const registerResponse = await fetch("/api/register-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({
          email,
          name: email.split("@")[0], // Usar parte del email como nombre
          verified: true, // Marcar como verificado directamente
        }),
      })

      if (!registerResponse.ok) {
        throw new Error(`Error al registrar: ${registerResponse.status}`)
      }

      const registerData = await registerResponse.json()

      if (registerData.success) {
        toast({
          title: "Éxito",
          description: registerData.alreadyExists
            ? "Usuario verificado manualmente"
            : "Usuario creado y verificado manualmente",
        })
        setEmail("")
      } else {
        throw new Error(registerData.message || "Error al verificar el usuario")
      }
    } catch (error) {
      console.error("Error:", error)

      // Si falla el registro, intentamos verificar directamente
      try {
        const verifyResponse = await fetch("/api/admin/verify-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          body: JSON.stringify({ email }),
        })

        if (!verifyResponse.ok) {
          throw new Error(`Error: ${verifyResponse.status}`)
        }

        const verifyData = await verifyResponse.json()

        if (verifyData.success) {
          toast({
            title: "Éxito",
            description: verifyData.alreadyVerified
              ? "El usuario ya estaba verificado"
              : verifyData.created
                ? "Usuario creado y verificado manualmente"
                : "Usuario verificado manualmente",
          })
          setEmail("")
        } else {
          throw new Error(verifyData.message || "Error al verificar el usuario")
        }
      } catch (secondError) {
        console.error("Error en segundo intento:", secondError)
        toast({
          title: "Error",
          description: "No se pudo verificar el usuario después de múltiples intentos",
          variant: "destructive",
        })
      }
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verificación Manual</CardTitle>
        <CardDescription>Verifica manualmente a un usuario por su correo electrónico</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2">
          <Input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button onClick={handleVerify} disabled={isVerifying} className="bg-green-600 hover:bg-green-700">
            {isVerifying ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Verificar
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
