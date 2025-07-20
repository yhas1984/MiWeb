"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { getCurrentRates } from "@/lib/rates-service"
// Importación correcta de los iconos
import { Send, User, Bot, Loader2, AlertCircle, RefreshCw } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface AIChatProps {
  isFloating?: boolean
  onError?: (error: string) => void
}

export function AIChat({ isFloating = false, onError }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Función para formatear el texto con saltos de línea y enlaces
  const formatText = (text: string) => {
    // Expresión regular para detectar URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g

    // Dividir el texto por saltos de línea
    const lines = text.split("\n")

    return lines.map((line, i) => {
      // Procesar enlaces en cada línea
      const parts = []
      let lastIndex = 0
      let match

      // Usar regex para encontrar URLs en el texto
      const regex = new RegExp(urlRegex)
      while ((match = regex.exec(line)) !== null) {
        // Añadir el texto antes del enlace
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index))
        }

        // Añadir el enlace como elemento <a>
        parts.push(
          <a
            key={`link-${i}-${match.index}`}
            href={match[0]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {match[0]}
          </a>,
        )

        lastIndex = match.index + match[0].length
      }

      // Añadir el resto del texto después del último enlace
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex))
      }

      // Si no se encontraron enlaces, devolver la línea completa
      if (parts.length === 0) {
        parts.push(line)
      }

      return (
        <span key={i}>
          {parts}
          {i < lines.length - 1 && <br />}
        </span>
      )
    })
  }

  // Cargar tasas y actualizar el mensaje inicial
  const loadRatesAndUpdateWelcome = async () => {
    try {
      console.log("Cargando tasas para el chat...")

      // Obtener tasas del servicio centralizado
      const rates = getCurrentRates()
      console.log("Tasas obtenidas para el chat:", rates)

      // Actualizar el mensaje inicial con las tasas actuales
      const initialMessage: Message = {
        role: "assistant",
        content: `¡Hola! En Tu Envio Express manejamos dos tipos de tasas para el cambio de Euros a Bolívares:

💰 **Tasa estándar** (usuarios no registrados): **1 EUR = ${rates.standardRate} VES**
🔴 **Tasa premium** (usuarios registrados): **1 EUR = ${rates.premiumRate} VES**

¡Te recomendamos registrarte a través de nuestro formulario para acceder a la tasa premium más ventajosa! 😊 Las tasas se actualizan diariamente.`,
      }

      setMessages([initialMessage])
    } catch (error) {
      console.error("Error al obtener las tasas:", error)
      // Usar un mensaje genérico en caso de error
      const initialMessage: Message = {
        role: "assistant",
        content: `¡Hola! Soy el asistente virtual de Tu Envio Express. ¿En qué puedo ayudarte hoy?`,
      }
      setMessages([initialMessage])
    }
  }

  // Cargar tasas al montar el componente
  useEffect(() => {
    // Forzar una actualización inmediata
    loadRatesAndUpdateWelcome()

    // Configurar actualización periódica de tasas (cada 5 minutos)
    const rateUpdateInterval = setInterval(
      () => {
        loadRatesAndUpdateWelcome()
      },
      5 * 60 * 1000,
    )

    // Escuchar eventos de actualización de tasas
    const handleRatesUpdated = (event: CustomEvent) => {
      console.log("Evento ratesUpdated recibido en AIChat:", event.detail)
      // Forzar actualización inmediata cuando se recibe el evento
      loadRatesAndUpdateWelcome()
    }

    window.addEventListener("ratesUpdated", handleRatesUpdated as EventListener)

    return () => {
      clearInterval(rateUpdateInterval)
      window.removeEventListener("ratesUpdated", handleRatesUpdated as EventListener)
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, error])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setError(null)

    try {
      // Implementar un timeout del lado del cliente
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.log("Timeout alcanzado, abortando solicitud...")
        controller.abort()
      }, 15000) // 15 segundos de timeout

      const assistantResponse = await generateResponse(input)
      setMessages((prev) => [...prev, { role: "assistant", content: assistantResponse }])
      clearTimeout(timeoutId)
      setRetryCount(0)
    } catch (err) {
      console.error("Error al enviar mensaje:", err)

      // Manejar el error de forma segura
      const isTimeoutError = 
        (err instanceof DOMException && err.name === "AbortError") || 
        (err instanceof Error && err.message.includes("timeout"))

      const errorMessage = isTimeoutError
        ? "La solicitud ha excedido el tiempo de espera. Por favor, intenta de nuevo."
        : err instanceof Error
          ? err.message
          : "Error desconocido"

      setError(errorMessage)

      // Notificar al componente padre si existe la función onError
      if (onError) {
        onError(errorMessage)
      }

      // Solo mostrar toast si no es un error de timeout o si es el primer intento
      if (!isTimeoutError || retryCount === 0) {
        toast({
          title: "Error en el chat",
          description: errorMessage,
          variant: "destructive",
        })
      }

      // Si es un error de timeout y no hemos excedido los reintentos, intentar de nuevo automáticamente
      if (isTimeoutError && retryCount < 2) {
        setRetryCount((prev) => prev + 1)
        setTimeout(() => {
          setError(null)
          setIsLoading(true)
          handleSendMessage()
        }, 1000)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleRetry = () => {
    setIsRetrying(true)
    setError(null)
    setRetryCount(0)

    // Reiniciar el chat con el mensaje inicial
    loadRatesAndUpdateWelcome()

    setTimeout(() => {
      setIsRetrying(false)
    }, 1000)
  }

  // Si hay un error grave y no es el modo flotante, mostrar pantalla de error
  if (error && !isFloating && !isLoading && !isRetrying) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-lg border-red-200 h-[500px] flex flex-col">
        <CardHeader className="bg-red-50 text-red-800">
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Error en el Asistente Virtual
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No pudimos conectar con el asistente</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={handleRetry} className="mx-auto">
              {isRetrying ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Reiniciando...
                </>
              ) : (
                "Intentar nuevamente"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Si es flotante, no necesitamos el Card wrapper
  if (isFloating) {
    return (
      <div className="flex flex-col h-[450px]">
        <ScrollArea className="flex-grow p-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex mb-4 ${message.role === "assistant" ? "justify-start" : "justify-end"}`}>
              <div className="flex items-start max-w-[80%]">
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarFallback className="bg-amber-500 text-white">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-lg px-4 py-2 ${
                    message.role === "assistant" ? "bg-gray-100 text-gray-800" : "bg-amber-500 text-white ml-2"
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{formatText(message.content)}</div>
                </div>
                {message.role === "user" && (
                  <Avatar className="h-8 w-8 ml-2">
                    <AvatarFallback className="bg-gray-700 text-white">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="flex items-start max-w-[80%]">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarFallback className="bg-amber-500 text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-lg px-4 py-2 bg-gray-100 text-gray-800">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="flex justify-center mb-4">
              <div className="flex items-center bg-red-50 text-red-800 rounded-lg px-4 py-2 text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span>Error: {error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="ml-2 h-6 text-red-600 hover:text-red-800 hover:bg-red-100"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </ScrollArea>
        <div className="p-4 border-t">
          <div className="flex w-full items-center space-x-2">
            <Input
              placeholder="Escribe tu mensaje..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="bg-amber-500 hover:bg-amber-600"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Versión normal para la página dedicada
  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-amber-200 h-[500px] flex flex-col">
      <CardHeader className="bg-gradient-to-r from-amber-500 to-amber-400 text-white">
        <CardTitle className="flex items-center">
          <Bot className="h-5 w-5 mr-2" />
          Asistente Virtual
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow p-0 overflow-hidden">
        <ScrollArea className="h-[320px] p-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex mb-4 ${message.role === "assistant" ? "justify-start" : "justify-end"}`}>
              <div className="flex items-start max-w-[80%]">
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarFallback className="bg-amber-500 text-white">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-lg px-4 py-2 ${
                    message.role === "assistant" ? "bg-gray-100 text-gray-800" : "bg-amber-500 text-white ml-2"
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{formatText(message.content)}</div>
                </div>
                {message.role === "user" && (
                  <Avatar className="h-8 w-8 ml-2">
                    <AvatarFallback className="bg-gray-700 text-white">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="flex items-start max-w-[80%]">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarFallback className="bg-amber-500 text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-lg px-4 py-2 bg-gray-100 text-gray-800">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="flex justify-center mb-4">
              <div className="flex items-center bg-red-50 text-red-800 rounded-lg px-4 py-2 text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span>Error: {error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="ml-2 h-6 text-red-600 hover:text-red-800 hover:bg-red-100"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-4 pt-2 border-t">
        <div className="flex w-full items-center space-x-2">
          <Input
            placeholder="Escribe tu mensaje..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="bg-amber-500 hover:bg-amber-600"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

const generateResponse = async (message: string) => {
  // Obtener las tasas actuales
  const rates = getCurrentRates()
  const standardRate = rates.standardRate
  const premiumRate = rates.premiumRate

  // Formatear las tasas con un decimal si es necesario
  const formattedStandardRate = standardRate % 1 === 0 ? standardRate : standardRate.toFixed(1)
  const formattedPremiumRate = premiumRate % 1 === 0 ? premiumRate : premiumRate.toFixed(1)

  // Respuestas predefinidas mejoradas
  const responses = {
    greeting: `¡Hola! En Tu Envío Express manejamos dos tipos de tasas para el cambio de Euros a Bolívares:

👉 **Tasa estándar** (usuarios no registrados): **1 EUR = ${formattedStandardRate} VES**

🔴 **Tasa premium** (usuarios registrados): **1 EUR = ${formattedPremiumRate} VES**

Te invitamos a registrarte mediante nuestro formulario Google: https://forms.gle/7jumFvRtnZn7tzhG6 para acceder a la tasa premium más beneficiosa. 😊 Las tasas se actualizan periódicamente en nuestra web.

¿Necesitas ayuda con algo más?`,

    rates: `Actualmente nuestras tasas de cambio son:

👉 **Tasa estándar** (usuarios no registrados): **1 EUR = ${formattedStandardRate} VES**

🔴 **Tasa premium** (usuarios registrados): **1 EUR = ${formattedPremiumRate} VES**

Las tasas se actualizan diariamente según el mercado.`,

    register: `Para registrarte y obtener nuestra tasa premium:

1. Completa nuestro formulario de registro: https://forms.gle/7jumFvRtnZn7tzhG6
2. Recibirás un correo de confirmación con un código
3. Verifica tu cuenta con el código recibido
4. ¡Listo! Tendrás acceso inmediato a nuestra tasa premium de ${formattedPremiumRate} VES por 1 EUR

El proceso es rápido y sencillo. ¿Necesitas ayuda con el registro?`,

    contact: `Puedes contactarnos a través de:

📧 Email: contacto@tuenvioexpress.es
📱 WhatsApp: +34 643670541
🌐 Formulario de contacto en nuestra web

Estamos disponibles de lunes a viernes de 8:00 AM a 11:00 PM (hora de España).`,

    default: `Gracias por tu mensaje. Si tienes preguntas sobre nuestras tasas de cambio, proceso de registro o servicios, no dudes en preguntar. Estoy aquí para ayudarte.`,
  }

  // Determinar qué respuesta enviar basado en el mensaje del usuario
  const lowercaseMessage = message.toLowerCase()

  if (
    lowercaseMessage.includes("hola") ||
    lowercaseMessage.includes("buenos") ||
    lowercaseMessage.includes("saludos") ||
    lowercaseMessage.includes("buenas")
  ) {
    return responses.greeting
  }

  if (
    lowercaseMessage.includes("tasa") ||
    lowercaseMessage.includes("cambio") ||
    lowercaseMessage.includes("euro") ||
    lowercaseMessage.includes("bolivar") ||
    lowercaseMessage.includes("precio")
  ) {
    return responses.rates
  }

  if (
    lowercaseMessage.includes("registr") ||
    lowercaseMessage.includes("crear cuenta") ||
    lowercaseMessage.includes("premium") ||
    lowercaseMessage.includes("verificar")
  ) {
    return responses.register
  }

  if (
    lowercaseMessage.includes("contact") ||
    lowercaseMessage.includes("teléfono") ||
    lowercaseMessage.includes("email") ||
    lowercaseMessage.includes("correo") ||
    lowercaseMessage.includes("whatsapp")
  ) {
    return responses.contact
  }

  return responses.default
}
