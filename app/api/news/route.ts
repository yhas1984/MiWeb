import { type NextRequest, NextResponse } from "next/server"
import { getGoogleNewsRSS } from "@/lib/google-news-service"
import type { NewsArticle } from "@/lib/google-news-service"

// URLs de imágenes de respaldo (usando Unsplash para imágenes libres de derechos)
const FALLBACK_IMAGES = {
  economia: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1000&auto=format&fit=crop",
  tipoDeCambio: "https://images.unsplash.com/photo-1621155346337-1d19476ba7d6?q=80&w=1000&auto=format&fit=crop",
  regulaciones: "https://images.unsplash.com/photo-1634128221889-82ed6efebfc3?q=80&w=1000&auto=format&fit=crop",
  venezuela: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?q=80&w=1000&auto=format&fit=crop",
}

// Función para validar URL
const isValidUrl = (url: string) => {
  try {
    new URL(url)
    return true
  } catch (e) {
    return false
  }
}

// Noticias de respaldo (fallback) - solo se usan si hay un error
const getFallbackNews = () => {
  return [
    {
      id: "fallback-1",
      title: "Banco Central de Venezuela anuncia nuevas medidas cambiarias",
      summary: "El BCV implementará nuevas políticas para estabilizar el tipo de cambio en el mercado venezolano.",
      content:
        "El Banco Central de Venezuela (BCV) anunció este lunes un conjunto de medidas destinadas a estabilizar el mercado cambiario nacional. Entre las principales acciones se encuentra la inyección de divisas al sistema bancario y nuevos mecanismos de control para las operaciones de cambio. Estas medidas buscan reducir la volatilidad del bolívar frente a monedas extranjeras y fortalecer la economía nacional.",
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
        "De acuerdo con el último informe del Instituto Nacional de Estadística (INE), la inflación mensual en Venezuela ha mostrado una tendencia a la baja durante los últimos tres meses. Esta desaceleración representa un alivio para la economía venezolana, que ha enfrentado una de las inflaciones más altas del mundo en los últimos años. Analistas económicos señalan que esta tendencia podría contribuir a una mayor estabilidad del bolívar frente al euro y otras divisas internacionales.",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      source: "Instituto Nacional de Estadística",
      sourceUrl: "https://www.ine.gov.ve",
      imageUrl: FALLBACK_IMAGES.tipoDeCambio,
      tags: ["inflacion", "economia", "estadisticas"],
    },
    {
      id: "fallback-3",
      title: "Nuevas regulaciones para operaciones de cambio de divisas",
      summary: "El gobierno venezolano establece nuevos requisitos para las casas de cambio y operadores financieros.",
      content:
        "La Superintendencia Nacional de Valores (SUNAVAL) ha publicado una nueva normativa que regula las operaciones de cambio de divisas en el país. Las nuevas disposiciones establecen requisitos más estrictos para las casas de cambio y operadores financieros, con el objetivo de aumentar la transparencia y seguridad en las transacciones. Estas medidas podrían afectar temporalmente la disponibilidad de divisas en el mercado, pero se espera que a largo plazo contribuyan a un sistema cambiario más estable y confiable.",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      source: "Superintendencia Nacional de Valores",
      sourceUrl: "https://www.sunaval.gob.ve",
      imageUrl: FALLBACK_IMAGES.regulaciones,
      tags: ["regulaciones", "casas de cambio", "divisas"],
    },
  ]
}

// Función para validar y limpiar los artículos de noticias
const validateAndCleanArticles = (articles: NewsArticle[]): NewsArticle[] => {
  return articles.map((article) => {
    // Asegurarse de que todos los campos de texto sean strings
    const cleanedArticle = {
      ...article,
      id:
        typeof article.id === "string"
          ? article.id
          : `news-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: typeof article.title === "string" ? article.title : "Sin título",
      summary: typeof article.summary === "string" ? article.summary : "Sin descripción disponible",
      content: typeof article.content === "string" ? article.content : "Contenido no disponible",
      source: typeof article.source === "string" ? article.source : "Fuente desconocida",
      sourceUrl: typeof article.sourceUrl === "string" && isValidUrl(article.sourceUrl) ? article.sourceUrl : "",
      // Verificar que la URL de la imagen sea válida
      imageUrl:
        typeof article.imageUrl === "string" && isValidUrl(article.imageUrl)
          ? article.imageUrl
          : article.tags.includes("economia")
            ? FALLBACK_IMAGES.economia
            : article.tags.includes("tipo de cambio")
              ? FALLBACK_IMAGES.tipoDeCambio
              : article.tags.includes("regulaciones")
                ? FALLBACK_IMAGES.regulaciones
                : FALLBACK_IMAGES.venezuela,
      // Asegurarse de que las etiquetas sean un array
      tags: Array.isArray(article.tags) ? article.tags : ["venezuela", "economia"],
    }

    return cleanedArticle
  })
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const tag = searchParams.get("tag")
  const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit") as string) : 10
  const forceRefresh = searchParams.get("refresh") === "true"
  // Solo usar fallback si se solicita explícitamente o si hay un error
  const useFallback = searchParams.get("fallback") === "true"

  try {
    // Mapear el tag a una categoría de Google News
    let category = "general"
    if (tag) {
      if (tag.includes("economia")) category = "economia"
      else if (tag.includes("tipo")) category = "tipoDeCambio"
      else if (tag.includes("regulacion")) category = "regulaciones"
    }

    // Intentar obtener noticias de Google News RSS
    console.log(`Obteniendo noticias de Google News RSS para categoría: ${category}`)

    // IMPORTANTE: Siempre usar noticias reales, ignorar la variable de entorno
    const useMockNews = false

    let newsArticles: NewsArticle[] = []

    // Obtener noticias reales de Google News
    try {
      newsArticles = await getGoogleNewsRSS(category, 20)

      if (!newsArticles || newsArticles.length === 0) {
        console.log("No se encontraron noticias en Google News, usando respaldo")
        newsArticles = getFallbackNews()
      }
    } catch (googleNewsError) {
      console.error("Error al obtener noticias de Google News:", googleNewsError)
      newsArticles = getFallbackNews()
    }

    // Validar y limpiar los artículos
    const cleanedNews = validateAndCleanArticles(newsArticles)

    // Filtrar por tag si se proporciona
    let filteredNews = cleanedNews
    if (tag) {
      filteredNews = filteredNews.filter((item) => item.tags.some((t: string) => t.toLowerCase() === tag.toLowerCase()))
    }

    // Si no hay noticias después del filtrado, usar noticias de respaldo
    if (filteredNews.length === 0) {
      console.log("No hay noticias después del filtrado, usando respaldo")
      filteredNews = getFallbackNews()
    }

    // Limitar resultados
    const limitedNews = filteredNews.slice(0, limit)

    return NextResponse.json(limitedNews)
  } catch (error) {
    console.error("Error al obtener noticias:", error)

    // En caso de error, devolver noticias de respaldo
    const fallbackNews = getFallbackNews()
    const limitedNews = fallbackNews.slice(0, limit)

    return NextResponse.json(limitedNews)
  }
}
