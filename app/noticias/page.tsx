"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ArrowLeft, RefreshCw, AlertCircle, Newspaper } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

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
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsArticle[]>([])
  const [filteredNews, setFilteredNews] = useState<NewsArticle[]>([])
  const [isLoadingNews, setIsLoadingNews] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"news">("news")
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchNews = async () => {
      setIsLoadingNews(true)
      setError(null)

      try {
        // Usar un timestamp para evitar problemas de caché
        const timestamp = new Date().getTime()

        // Obtener noticias reales
        const response = await fetch(`/api/news?_t=${timestamp}`, {
          cache: "no-store",
          next: { revalidate: 0 },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Error al cargar las noticias: ${response.status}`)
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("No se encontraron noticias disponibles")
        }

        // Guardar las noticias en sessionStorage para mantener consistencia
        sessionStorage.setItem("currentNewsList", JSON.stringify(data))

        setNews(data)
        setFilteredNews(data)
      } catch (error) {
        console.error("Error:", error)
        setError(error instanceof Error ? error.message : "Error al cargar noticias")

        // Intentar cargar desde sessionStorage si hay un error
        const cachedNews = sessionStorage.getItem("currentNewsList")
        if (cachedNews) {
          try {
            const parsedNews = JSON.parse(cachedNews)
            setNews(parsedNews)
            setFilteredNews(parsedNews)
            return
          } catch (e) {
            console.error("Error al cargar noticias desde caché:", e)
          }
        }

        toast({
          title: "Error al cargar noticias",
          description: error instanceof Error ? error.message : "No se pudieron cargar las noticias en este momento",
          variant: "destructive",
        })
      } finally {
        setIsLoadingNews(false)
      }
    }

    fetchNews()
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredNews(news)
      return
    }

    const term = searchTerm.toLowerCase()

    // Filtrar noticias
    const newsFiltered = news.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        item.summary.toLowerCase().includes(term) ||
        item.content.toLowerCase().includes(term) ||
        (item.tags && item.tags.some((tag) => tag.toLowerCase().includes(term))),
    )
    setFilteredNews(newsFiltered)
  }, [searchTerm, news])

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

  const handleTagClick = (tag: string) => {
    setSearchTerm(tag)
  }

  const handleRefresh = () => {
    setIsLoadingNews(true)
    setError(null)

    // Usar un timestamp para evitar problemas de caché
    const timestamp = new Date().getTime()

    fetch(`/api/news?_t=${timestamp}`, {
      cache: "no-store",
      next: { revalidate: 0 },
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => {
            throw new Error(data.error || `Error: ${response.status}`)
          })
        }
        return response.json()
      })
      .then((data) => {
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("No se encontraron noticias disponibles")
        }

        // Guardar las noticias en sessionStorage para mantener consistencia
        sessionStorage.setItem("currentNewsList", JSON.stringify(data))

        setNews(data)
        setFilteredNews(
          searchTerm.trim() === ""
            ? data
            : data.filter(
                (item: NewsArticle) =>
                  item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (item.tags && item.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))),
              ),
        )

        toast({
          title: "Noticias actualizadas",
          description: "Se han cargado las noticias más recientes.",
          variant: "default",
        })
      })
      .catch((error) => {
        console.error("Error al actualizar noticias:", error)
        setError(error instanceof Error ? error.message : "Error al actualizar noticias")
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "No se pudieron actualizar las noticias",
          variant: "destructive",
        })
      })
      .finally(() => setIsLoadingNews(false))
  }

  // Función para generar un color de fondo basado en la categoría
  const getCategoryColor = (tag: string) => {
    switch (tag.toLowerCase()) {
      case "economia":
        return "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
      case "tipo de cambio":
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
    } else if (tags.includes("tipo de cambio")) {
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

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <Link href="/" className="inline-flex items-center text-amber-600 hover:text-amber-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio
          </Link>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 text-amber-500">
              <Newspaper className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-bold">Noticias Económicas de Venezuela</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Mantente informado sobre las últimas noticias que pueden afectar la economía venezolana y la tasa de cambio.
          </p>
        </div>
        <div className="w-full md:w-auto flex flex-col md:flex-row gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoadingNews}
            className="text-amber-600 border-amber-200 hover:bg-amber-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingNews ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="news" className="w-full mb-8">
        <TabsList className="w-full md:w-auto grid grid-cols-1 mb-6 bg-white shadow-sm">
          <TabsTrigger value="news">Noticias</TabsTrigger>
        </TabsList>

        <TabsContent value="news" className="mt-0">
          {isLoadingNews ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Card key={item} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
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
              ))}
            </div>
          ) : error && filteredNews.length === 0 ? (
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
          ) : filteredNews.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNews.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden h-full flex flex-col shadow-md hover:shadow-lg transition-shadow duration-300 border-t-4 border-amber-500"
                >
                  {/* Contenedor de imagen con altura fija */}
                  <div className="relative h-48 w-full bg-gray-200">
                    {/* Usar un div con fondo en lugar de Image para evitar problemas */}
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${
                          isValidUrl(item.imageUrl) ? item.imageUrl : getFallbackImage(item.tags)
                        })`,
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
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.tags &&
                        item.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className={getCategoryColor(tag)}
                            onClick={() => handleTagClick(tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                    </div>
                    <p className="text-gray-600 line-clamp-3">{item.content && item.content.substring(0, 150)}...</p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button
                      asChild
                      variant="outline"
                      className="w-full hover:bg-amber-50 hover:text-amber-600 transition-colors"
                    >
                      <Link
                        href={`/noticias/${item.id}`}
                        onClick={() => {
                          // Guardar la noticia actual en sessionStorage
                          sessionStorage.setItem("currentNewsItem", JSON.stringify(item))
                        }}
                      >
                        Leer más
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No se encontraron noticias que coincidan con tu búsqueda.</p>
              <Button onClick={() => setSearchTerm("")} variant="outline">
                Ver todas las noticias
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
