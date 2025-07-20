"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, RefreshCw, AlertCircle, Clock, Info, Newspaper } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"

interface NewsArticle {
  id: string
  title: string
  summary: string
  content: string
  date: string
  source: string
  sourceUrl: string
  imageUrl: string
  tags: string[]
}

// URLs de imágenes de respaldo (usando Unsplash para imágenes libres de derechos)
const FALLBACK_IMAGES = {
  economia: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1000&auto=format&fit=crop",
  tipoDeCambio: "https://images.unsplash.com/photo-1621155346337-1d19476ba7d6?q=80&w=1000&auto=format&fit=crop",
  regulaciones: "https://images.unsplash.com/photo-1634128221889-82ed6efebfc3?q=80&w=1000&auto=format&fit=crop",
  venezuela: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?q=80&w=1000&auto=format&fit=crop",
  default: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1000&auto=format&fit=crop",
}

export function NewsSection() {
  const [news, setNews] = useState<NewsArticle[]>([])
  const [isLoadingNews, setIsLoadingNews] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [error, setError] = useState<string | null>(null)
  const [isNewsCached, setIsNewsCached] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const { toast } = useToast()

  // Plugin de autoplay para el carrusel
  const autoplayPlugin = Autoplay({ delay: 5000, stopOnInteraction: false })

  const fetchNews = async () => {
    setIsLoadingNews(true)
    setError(null)
    setIsNewsCached(false)

    try {
      // Usar un timestamp para evitar problemas de caché
      const timestamp = new Date().getTime()

      // Importante: Especificar que queremos noticias económicas y usar fallback si es necesario
      const response = await fetch(`/api/news?_t=${timestamp}&tag=economia&fallback=true`, {
        cache: "no-store",
        next: { revalidate: 0 },
      })

      if (!response.ok) {
        throw new Error(`Error al cargar las noticias: ${response.status}`)
      }

      // Intentar parsear la respuesta como JSON
      let data
      try {
        const text = await response.text()
        data = JSON.parse(text)
      } catch (parseError) {
        console.error("Error al parsear respuesta JSON:", parseError)
        throw new Error("La respuesta no es un JSON válido")
      }

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("No se encontraron noticias disponibles")
      }

      // Guardar las noticias en sessionStorage para mantener consistencia
      sessionStorage.setItem("currentNewsList", JSON.stringify(data))

      setNews(data)
      setLastUpdated(new Date())
      setRetryCount(0) // Resetear contador de reintentos tras éxito
    } catch (error) {
      console.error("Error:", error)
      setError(error instanceof Error ? error.message : "Error al cargar noticias")
      setRetryCount((prev) => prev + 1)

      // Intentar cargar desde sessionStorage si hay un error
      const cachedNews = sessionStorage.getItem("currentNewsList")
      if (cachedNews) {
        try {
          const parsedNews = JSON.parse(cachedNews)
          setNews(parsedNews)
          setIsNewsCached(true)
          setLastUpdated(new Date())
          return
        } catch (e) {
          console.error("Error al cargar noticias desde caché:", e)
        }
      }

      // Si el contador de reintentos es bajo, intentar de nuevo automáticamente
      if (retryCount < 2) {
        setTimeout(() => {
          fetchNews()
        }, 1000)
      } else {
        // Usar noticias de respaldo si todo lo demás falla
        const fallbackNews = [
          {
            id: "fallback-1",
            title: "Banco Central de Venezuela anuncia nuevas medidas cambiarias",
            summary:
              "El BCV implementará nuevas políticas para estabilizar el tipo de cambio en el mercado venezolano.",
            content:
              "El Banco Central de Venezuela (BCV) anunció este lunes un conjunto de medidas destinadas a estabilizar el mercado cambiario nacional...",
            date: new Date().toISOString(),
            source: "Noticias Económicas",
            sourceUrl: "https://www.bcv.org.ve",
            imageUrl: FALLBACK_IMAGES.economia,
            tags: ["economia", "tipo de cambio", "BCV"],
          },
          {
            id: "fallback-2",
            title: "Inflación en Venezuela muestra signos de desaceleración",
            summary: "Según datos oficiales, la inflación mensual ha disminuido por tercer mes consecutivo.",
            content:
              "De acuerdo con el último informe del Instituto Nacional de Estadística (INE), la inflación mensual en Venezuela ha mostrado una tendencia a la baja...",
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            source: "Instituto Nacional de Estadística",
            sourceUrl: "https://www.ine.gov.ve",
            imageUrl: FALLBACK_IMAGES.tipoDeCambio,
            tags: ["inflacion", "economia", "estadisticas"],
          },
          {
            id: "fallback-3",
            title: "Nuevas regulaciones para operaciones de cambio de divisas",
            summary:
              "El gobierno venezolano establece nuevos requisitos para las casas de cambio y operadores financieros.",
            content:
              "La Superintendencia Nacional de Valores (SUNAVAL) ha publicado una nueva normativa que regula las operaciones de cambio de divisas en el país...",
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            source: "Superintendencia Nacional de Valores",
            sourceUrl: "https://www.sunaval.gob.ve",
            imageUrl: FALLBACK_IMAGES.regulaciones,
            tags: ["regulaciones", "casas de cambio", "divisas"],
          },
        ]

        setNews(fallbackNews)
        setIsNewsCached(true)
        setLastUpdated(new Date())

        toast({
          title: "Usando noticias de respaldo",
          description: "No se pudieron cargar las noticias en tiempo real. Mostrando noticias de respaldo.",
          variant: "default",
        })
      }
    } finally {
      setIsLoadingNews(false)
    }
  }

  useEffect(() => {
    fetchNews()
  }, [])

  const formatDate = (dateString: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
      return new Date(dateString).toLocaleDateString("es-ES", options)
    } catch (e) {
      return "Fecha no disponible"
    }
  }

  const handleRefresh = () => {
    setRetryCount(0)
    fetchNews()
  }

  // Función para generar un color de fondo basado en la categoría
  const getCategoryColor = (tag: string) => {
    switch (tag.toLowerCase()) {
      case "economia":
        return "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
      case "tipo de cambio":
      case "tipodecambio":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200"
      case "regulaciones":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200"
      case "venezuela":
        return "bg-amber-100 text-amber-800 hover:bg-amber-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  // Función para obtener una imagen de respaldo basada en la categoría
  const getFallbackImage = (tags: string[]) => {
    if (tags.includes("economia")) {
      return FALLBACK_IMAGES.economia
    } else if (tags.includes("tipo de cambio") || tags.includes("tipodecambio")) {
      return FALLBACK_IMAGES.tipoDeCambio
    } else if (tags.includes("regulaciones")) {
      return FALLBACK_IMAGES.regulaciones
    } else {
      return FALLBACK_IMAGES.venezuela
    }
  }

  // Función para verificar si una URL es válida
  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch (e) {
      return false
    }
  }

  // Función para abrir enlaces externos en una nueva pestaña
  const openExternalLink = (url: string) => {
    if (!url) return

    // Si la URL no tiene protocolo, añadir https://
    let finalUrl = url
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      finalUrl = "https://" + url
    }

    window.open(finalUrl, "_blank", "noopener,noreferrer")
  }

  // Renderizar tarjetas de noticias para el carrusel
  const renderNewsCards = () => {
    return news.map((item) => (
      <CarouselItem key={item.id} className="md:basis-1/2 lg:basis-1/3">
        <Card className="h-full flex flex-col shadow-md hover:shadow-lg transition-shadow duration-300 border-t-4 border-amber-500">
          <div className="relative h-48 w-full bg-gray-200">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${isValidUrl(item.imageUrl) ? item.imageUrl : getFallbackImage(item.tags)})`,
              }}
            ></div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
              <div className="text-xs text-white font-medium">{formatDate(item.date)}</div>
            </div>
          </div>
          <CardHeader className="pb-2">
            <div className="flex items-center text-xs text-gray-500 mb-1">
              <span className="font-medium text-amber-600">{item.source}</span>
            </div>
            <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
            <CardDescription className="line-clamp-2">{item.summary}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow pt-0">
            <div className="flex flex-wrap gap-2 mb-2">
              {item.tags &&
                item.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className={getCategoryColor(tag)}>
                    {tag}
                  </Badge>
                ))}
            </div>
          </CardContent>
          <CardFooter className="pt-0 flex gap-2">
            <Button
              asChild
              variant="outline"
              className="flex-1 hover:bg-amber-50 hover:text-amber-600 transition-colors"
            >
              <Link
                href={`/noticias/${item.id}`}
                onClick={() => {
                  sessionStorage.setItem("currentNewsItem", JSON.stringify(item))
                }}
              >
                Leer más
              </Link>
            </Button>
            {item.sourceUrl && (
              <Button
                variant="outline"
                size="icon"
                className="hover:bg-amber-50 hover:text-amber-600"
                onClick={() => openExternalLink(item.sourceUrl)}
                title="Visitar fuente original"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </CarouselItem>
    ))
  }

  // Renderizar esqueletos para el carrusel durante la carga
  const renderSkeletonCards = () => {
    return [1, 2, 3].map((item) => (
      <CarouselItem key={item} className="md:basis-1/2 lg:basis-1/3">
        <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
          <Skeleton className="h-48 w-full" />
          <CardHeader>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </CarouselItem>
    ))
  }

  return (
    <section className="py-16 bg-gradient-to-b from-amber-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-500 mb-4">
            <Newspaper className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Noticias Económicas de Venezuela</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Mantente informado sobre las últimas noticias económicas de Venezuela que pueden afectar la tasa de cambio
            entre Euros y Bolívares.
          </p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="bg-white rounded-lg shadow-sm p-1">
            <Button variant="default" className="bg-amber-500 hover:bg-amber-600">
              Noticias Económicas de Venezuela
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {lastUpdated && (
              <div className="text-sm text-gray-500 flex items-center mr-2">
                <Clock className="h-4 w-4 mr-1" />
                <span>{lastUpdated.toLocaleTimeString()}</span>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoadingNews}
              className="text-amber-600 border-amber-200 hover:bg-amber-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingNews ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </div>
        </div>

        {isNewsCached && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 flex items-start">
            <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">Datos almacenados en caché</p>
              <p>
                Estamos mostrando noticias almacenadas previamente debido a problemas de conexión con las fuentes
                originales.
              </p>
            </div>
          </div>
        )}

        {isLoadingNews ? (
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>{renderSkeletonCards()}</CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
          </Carousel>
        ) : error && news.length === 0 ? (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-red-800 mb-2">Error al cargar noticias</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-100"
              >
                Intentar nuevamente
              </Button>
            </CardContent>
          </Card>
        ) : news.length > 0 ? (
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[autoplayPlugin]}
            className="w-full"
          >
            <CarouselContent>{renderNewsCards()}</CarouselContent>
            <CarouselPrevious className="bg-white text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700" />
            <CarouselNext className="bg-white text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700" />
          </Carousel>
        ) : (
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay noticias disponibles</h3>
              <p className="text-gray-600 mb-4">
                No se pudieron obtener noticias en este momento. Esto puede deberse a problemas de conexión con las
                fuentes de noticias.
              </p>
              <Button onClick={handleRefresh} variant="outline">
                Intentar nuevamente
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="text-center mt-8">
          <Button asChild className="bg-amber-500 hover:bg-amber-600 shadow-md hover:shadow-lg transition-shadow">
            <Link href="/noticias">
              Ver todas las noticias
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
