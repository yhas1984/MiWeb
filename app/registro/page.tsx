"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, TrendingUp, RefreshCw, CheckCircle, Mail, ClipboardList } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useUser } from "@/contexts/user-context"
import { useRouter } from "next/navigation"
import { formatDate } from "@/lib/rates-service"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrackEvent } from "@/components/analytics/track-event"

export default function RegistroPage() {
  const [standardRate, setStandardRate] = useState(72)
  const [premiumRate, setPremiumRate] = useState(73)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>("")
  const [email, setEmail] = useState("")
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [activeTab, setActiveTab] = useState("formulario")
  const [isMounted, setIsMounted] = useState(false)
  const { isLoggedIn, userEmail } = useUser()
  const router = useRouter()
  const { toast } = useToast()

  // Marcar el componente como montado para evitar problemas de hidratación
  useEffect(() => {
    setIsMounted(true)
    setLastUpdated(new Date().toISOString())
  }, [])

  // Cargar las tasas al montar el componente
  useEffect(() => {
    if (isMounted) {
      fetchRates()

      // Escuchar eventos de actualización de tasas
      const handleRatesUpdated = (event: CustomEvent) => {
        if (event.detail) {
          const newStandardRate = Number(event.detail.standardRate)
          const newPremiumRate = Number(event.detail.premiumRate)
          const newLastUpdated = event.detail.lastUpdated || new Date().toISOString()

          if (!isNaN(newStandardRate) && newStandardRate > 0) {
            setStandardRate(newStandardRate)
          }

          if (!isNaN(newPremiumRate) && newPremiumRate > 0) {
            setPremiumRate(newPremiumRate)
          }

          setLastUpdated(newLastUpdated)
        }
      }

      window.addEventListener("ratesUpdated", handleRatesUpdated as EventListener)

      return () => {
        window.removeEventListener("ratesUpdated", handleRatesUpdated as EventListener)
      }
    }
  }, [isMounted])

  // Función para cargar las tasas
  const fetchRates = async () => {
    setIsLoading(true)
    try {
      // Primero intentar cargar desde localStorage
      const savedRates = localStorage.getItem("tuenvioexpress_rates")
      if (savedRates) {
        const rates = JSON.parse(savedRates)

        const standardRateValue = Number(rates.standardRate)
        const premiumRateValue = Number(rates.premiumRate)

        if (!isNaN(standardRateValue) && standardRateValue > 0) {
          setStandardRate(standardRateValue)
        }

        if (!isNaN(premiumRateValue) && premiumRateValue > 0) {
          setPremiumRate(premiumRateValue)
        }

        if (rates.lastUpdated) {
          setLastUpdated(rates.lastUpdated)
        }
      }

      // Luego intentar obtener las tasas más recientes del servidor
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

        const standardRateValue = Number(data.standardRate)
        const premiumRateValue = Number(data.premiumRate)

        if (!isNaN(standardRateValue) && standardRateValue > 0) {
          setStandardRate(standardRateValue)
        }

        if (!isNaN(premiumRateValue) && premiumRateValue > 0) {
          setPremiumRate(premiumRateValue)
        }

        setLastUpdated(data.lastUpdated || new Date().toISOString())
      }
    } catch (error) {
      console.error("Error al obtener las tasas:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Función para enviar el código de verificación y redirigir
  const handleSendVerificationCode = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Por favor, ingresa tu correo electrónico",
        variant: "destructive",
      })
      return
    }

    setIsSendingCode(true)
    try {
      // Enviar directamente el código de verificación sin registrar al usuario primero
      // El endpoint de verificación se encargará de registrar al usuario si no existe
      const verifyResponse = await fetch("/api/send-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          name: email.split("@")[0],
        }),
      })

      const verifyData = await verifyResponse.json()

      if (verifyData.success) {
        toast({
          title: "Código enviado",
          description: "Se ha enviado un código de verificación a tu correo electrónico.",
        })

        // Redirigir a la página de verificación con el email como parámetro
        router.push(`/verificar?email=${encodeURIComponent(email)}`)
      } else {
        toast({
          title: "Error",
          description: verifyData.message || "No se pudo enviar el código de verificación",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al procesar tu solicitud",
        variant: "destructive",
      })
    } finally {
      setIsSendingCode(false)
    }
  }

  // Si el componente no está montado, mostrar un estado de carga para evitar problemas de hidratación
  if (!isMounted) {
    return (
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold text-center mb-4">Registro de Usuario</h1>
        <div className="max-w-4xl mx-auto flex justify-center items-center py-20">
          <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
          <span className="ml-2 text-lg">Cargando...</span>
        </div>
      </div>
    )
  }

  // Formatear la fecha usando la función del servicio
  const formattedDate = formatDate(lastUpdated)

  return (
    <div className="container mx-auto py-12 px-4">
      <TrackEvent eventName="registration_page_view" />
      <h1 className="text-3xl font-bold text-center mb-4">Registro de Usuario</h1>

      <div className="max-w-4xl mx-auto mb-8">
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center text-amber-800">
              <TrendingUp className="h-5 w-5 mr-2" />
              Beneficio Exclusivo para Usuarios Registrados
            </CardTitle>
            <CardDescription>
              Al registrarte, obtienes acceso a nuestra tasa preferencial para el cambio de EUR a VES.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-500 mb-1">Tasa Estándar</div>
                <div className="text-2xl font-bold text-amber-600">1 EUR = {standardRate} VES</div>
                <div className="mt-2 text-sm text-gray-500">Para usuarios no registrados</div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-green-200 relative overflow-hidden">
                <Badge className="absolute top-0 right-0 bg-green-500 text-white">
                  +{premiumRate - standardRate} VES
                </Badge>
                <div className="text-sm text-gray-500 mb-1">Tasa Premium</div>
                <div className="text-2xl font-bold text-green-600">1 EUR = {premiumRate} VES</div>
                <div className="mt-2 text-sm text-gray-500">Exclusiva para usuarios registrados</div>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <p className="flex items-center">
                <ArrowRight className="h-4 w-4 mr-2 text-amber-500" />
                Completa el formulario a continuación para acceder a nuestra tasa preferencial.
              </p>
              <p className="flex items-center mt-2 text-xs text-gray-500">
                <RefreshCw className="h-3 w-3 mr-1" />
                Tasas actualizadas: {formattedDate}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoggedIn ? (
        <div className="max-w-4xl mx-auto bg-green-50 p-8 rounded-lg shadow-md border-2 border-green-200">
          <div className="flex flex-col items-center text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-green-700 mb-2">¡Ya estás verificado!</h2>
            <p className="text-green-600 mb-4">
              Tu cuenta {userEmail} ha sido verificada correctamente y tienes acceso a nuestra tasa preferencial.
            </p>
            <div className="bg-white p-4 rounded-lg border border-green-200 mb-6">
              <div className="text-sm text-gray-500 mb-1">Tu Tasa Premium</div>
              <div className="text-3xl font-bold text-green-600">1 EUR = {premiumRate} VES</div>
            </div>
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link href="/">Volver al inicio</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          {/* Pestañas de navegación */}
          <div className="mb-8">
            <Tabs defaultValue="formulario" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b border-gray-200">
                <TabsList className="h-14 w-full bg-transparent p-0 mb-0 flex">
                  <TabsTrigger
                    value="formulario"
                    className={`flex-1 h-14 rounded-none border-b-2 text-base font-medium ${
                      activeTab === "formulario"
                        ? "border-amber-500 text-amber-600 bg-white"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <ClipboardList className="h-5 w-5 mr-2" />
                      <span>1. Formulario de Registro</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    value="verificacion"
                    className={`flex-1 h-14 rounded-none border-b-2 text-base font-medium ${
                      activeTab === "verificacion"
                        ? "border-amber-500 text-amber-600 bg-white"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <Mail className="h-5 w-5 mr-2" />
                      <span>2. Verificación</span>
                    </div>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="formulario" className="mt-0 p-0">
                <div className="bg-white rounded-b-lg shadow-md border-x border-b border-gray-200">
                  <iframe
                    src="https://docs.google.com/forms/d/e/1FAIpQLSfCgTMUk5_TuUMXa9pAKDGw-TcFSIIHLmF96PBonL2NUjJk6w/viewform?embedded=true"
                    width="100%"
                    height="1500px"
                    style={{
                      minHeight: "1500px",
                      border: "none",
                    }}
                    frameBorder="0"
                    className="w-full h-full"
                  >
                    Cargando…
                  </iframe>

                  <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                    <Button onClick={() => setActiveTab("verificacion")} className="bg-amber-500 hover:bg-amber-600">
                      <span>Continuar a verificación</span>
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="verificacion" className="mt-0 p-0">
                <div className="bg-amber-50 p-6 rounded-b-lg shadow-md border-x border-b border-amber-200">
                  <div className="flex items-start mb-6">
                    <div className="bg-amber-100 p-2 rounded-full mr-4">
                      <Mail className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-amber-800 mb-2">Verificación de cuenta</h3>
                      <p className="text-gray-700">
                        Ingresa tu correo electrónico para recibir el código de verificación y activar tu cuenta con
                        acceso a la tasa preferencial.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-amber-200 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                      <div className="flex-1">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Correo Electrónico
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="tu@email.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                        />
                      </div>
                      <Button
                        onClick={handleSendVerificationCode}
                        disabled={isSendingCode}
                        className="bg-amber-500 hover:bg-amber-600 h-10"
                      >
                        {isSendingCode ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Enviar código
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("formulario")}
                      className="border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                      Volver al formulario
                    </Button>

                    <Button asChild className="bg-blue-600 hover:bg-blue-700">
                      <Link href="/verificar">
                        Ir a la página de verificación
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">Proceso de Verificación</h2>
            <div className="space-y-4">
              <p className="text-blue-700">
                Después de completar el formulario de registro, recibirás un correo electrónico con un código de
                verificación.
              </p>
              <p className="text-blue-700">
                Este código es necesario para verificar tu cuenta y acceder a nuestra tasa preferencial de cambio.
              </p>
              <p className="text-blue-700">
                Si no recibes el correo electrónico en unos minutos, revisa tu carpeta de spam o solicita un nuevo
                código en la página de verificación.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
