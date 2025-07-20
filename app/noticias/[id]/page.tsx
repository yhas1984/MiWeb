"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ExternalLink, Calendar, Building } from "lucide-react"
import Link from "next/link"

// URLs de imágenes de respaldo (usando Unsplash para imágenes libres de derechos)
const FALLBACK_IMAGES = {
  economia: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1000&auto=format&fit=crop",
  tipoDeCambio: "https://images.unsplash.com/photo-1621155346337-1d19476ba7d6?q=80&w=1000&auto=format&fit=crop",
  regulaciones: "https://images.unsplash.com/photo-1634128221889-82ed6efebfc3?q=80&w=1000&auto=format&fit=crop",
  venezuela: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?q=80&w=1000&auto=format&fit=crop",
  default: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1000&auto=format&fit=crop",
}

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

export default function NewsDetailPage({ params }: { params: { id: string } }) {
  const [article, setArticle] = useState<NewsArticle | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchArticle = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Primero intentar obtener del sessionStorage
        const cachedItem = sessionStorage.getItem("currentNewsItem")
        if (cachedItem) {
          const parsedItem = JSON.parse(cachedItem)
          if (parsedItem.id === params.id) {
            setArticle(parsedItem)
            setIsLoading(false)
            return
          }
        }

        // Si no está en sessionStorage o no coincide el ID, buscar en la API
        const response = await fetch(`/api/news/${params.id}`)
        if (!response.ok) {
          throw new Error(`Error al cargar la noticia: ${response.status}`)
        }

        const data = await response.json()
        setArticle(data)
      } catch (error) {
        console.error("Error:", error)
        setError(error instanceof Error ? error.message : "Error al cargar la noticia")

        // Intentar obtener de la lista de noticias en sessionStorage
        try {
          const cachedList = sessionStorage.getItem("currentNewsList")
          if (cachedList) {
            const parsedList = JSON.parse(cachedList)
            const foundArticle = parsedList.find((item: NewsArticle) => item.id === params.id)
            if (foundArticle) {
              setArticle(foundArticle)
              setError(null)
            } else {
              // Si no se encuentra en la lista, usar un artículo de respaldo
              const fallbackArticle = {
                id: params.id,
                title: "Noticia económica de Venezuela",
                summary: "Información sobre la economía venezolana y el tipo de cambio.",
                content:
                  "Esta noticia no está disponible actualmente. Por favor, intente acceder más tarde o consulte otras noticias relacionadas con la economía venezolana.",
                date: new Date().toISOString(),
                source: "Tu Envio Express",
                sourceUrl: "",
                imageUrl: FALLBACK_IMAGES.default,
                tags: ["venezuela", "economia"],
              }
              setArticle(fallbackArticle)
              setError(null)
            }
          }
        } catch (e) {
          console.error("Error al buscar en caché:", e)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchArticle()
  }, [params.id])

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

  // Función para formatear la fecha
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

  // Función para obtener una imagen de respaldo basada en la categoría
  const getFallbackImage = (tags: string[] = []) => {
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="h-64 bg-gray-200 rounded mb-6"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !article) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6 text-center">
              <div className="text-red-500 text-5xl mb-4">😕</div>
              <h1 className="text-2xl font-bold text-red-800 mb-2">Noticia no encontrada</h1>
              <p className="text-red-600 mb-6">{error}</p>
              <Button asChild variant="outline" className="mr-4">
                <Link href="/noticias">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver a noticias
                </Link>
              </Button>
              <Button asChild>
                <Link href="/">Ir al inicio</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-amber-500 text-5xl mb-4">🔍</div>
              <h1 className="text-2xl font-bold mb-2">Noticia no encontrada</h1>
              <p className="text-gray-600 mb-6">No pudimos encontrar la noticia que estás buscando.</p>
              <Button asChild variant="outline" className="mr-4">
                <Link href="/noticias">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver a noticias
                </Link>
              </Button>
              <Button asChild>
                <Link href="/">Ir al inicio</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button asChild variant="outline" className="mb-4">
            <Link href="/noticias">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a noticias
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{article.title}</h1>

          <div className="flex flex-wrap gap-2 mb-4">
            {article.tags &&
              article.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="bg-amber-100 text-amber-800">
                  {tag}
                </Badge>
              ))}
          </div>

          <div className="flex items-center text-sm text-gray-500 mb-6">
            <Calendar className="h-4 w-4 mr-1" />
            <span className="mr-4">{formatDate(article.date)}</span>
            <Building className="h-4 w-4 mr-1" />
            <span>{article.source}</span>
          </div>
        </div>

        <div className="relative w-full h-80 mb-8 rounded-lg overflow-hidden bg-gray-200">
          {/* Usar un div con fondo en lugar de Image para evitar problemas */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${
                isValidUrl(article.imageUrl) ? article.imageUrl : getFallbackImage(article.tags)
              })`,
            }}
          ></div>
        </div>

        <div className="prose prose-amber max-w-none mb-8">
          <p className="text-xl font-medium mb-4">{article.summary}</p>
          <div className="whitespace-pre-line">{article.content}</div>
        </div>

        {article.sourceUrl && (
          <div className="mt-8 border-t pt-6">
            <p className="text-gray-600 mb-4">Para más información, visita la fuente original:</p>
            <Button onClick={() => openExternalLink(article.sourceUrl)} className="bg-amber-500 hover:bg-amber-600">
              Visitar fuente original
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
