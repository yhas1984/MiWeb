import { parse } from "node-html-parser"
import { XMLParser } from "fast-xml-parser"

// Interfaz para los artículos de noticias
export interface NewsArticle {
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

// Definir un tipo para las claves de FALLBACK_IMAGES
type FallbackImageKey = 'economia' | 'tipoDeCambio' | 'regulaciones' | 'venezuela' | 'default'

// URLs de imágenes de respaldo (usando Unsplash para imágenes libres de derechos)
const FALLBACK_IMAGES: Record<FallbackImageKey, string> = {
  economia: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1000&auto=format&fit=crop",
  tipoDeCambio: "https://images.unsplash.com/photo-1621155346337-1d19476ba7d6?q=80&w=1000&auto=format&fit=crop",
  regulaciones: "https://images.unsplash.com/photo-1634128221889-82ed6efebfc3?q=80&w=1000&auto=format&fit=crop",
  venezuela: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?q=80&w=1000&auto=format&fit=crop",
  default: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1000&auto=format&fit=crop",
}

// Actualizar las URLs de los feeds RSS de Google News para Venezuela
// Modificar la constante GOOGLE_NEWS_RSS_URLS para usar consultas más específicas
const GOOGLE_NEWS_RSS_URLS: Record<string, string> = {
  general: "https://news.google.com/rss/search?q=venezuela+economia+when:7d&hl=es-419&gl=VE&ceid=VE:es-419",
  economia: "https://news.google.com/rss/search?q=venezuela+economia+finanzas+when:7d&hl=es-419&gl=VE&ceid=VE:es-419",
  tipoDeCambio:
    "https://news.google.com/rss/search?q=venezuela+%22tipo+de+cambio%22+divisas+when:7d&hl=es-419&gl=VE&ceid=VE:es-419",
  regulaciones:
    "https://news.google.com/rss/search?q=venezuela+regulaciones+economicas+when:7d&hl=es-419&gl=VE&ceid=VE:es-419",
}

// Palabras clave para categorizar noticias
const CATEGORY_KEYWORDS = {
  economia: [
    "economía",
    "económico",
    "económica",
    "finanzas",
    "financiero",
    "financiera",
    "mercado",
    "bolsa",
    "inversión",
  ],
  tipoDeCambio: ["tipo de cambio", "divisa", "divisas", "dólar", "euro", "bolívar", "tasa", "cambio"],
  regulaciones: ["regulación", "regulaciones", "ley", "leyes", "decreto", "normativa", "norma", "legal", "legislación"],
}

// Función para limpiar HTML
function cleanHtml(html: string): string {
  if (!html) return ""

  try {
    // Eliminar etiquetas HTML
    const cleanText = html.replace(/<\/?[^>]+(>|$)/g, "")

    // Decodificar entidades HTML
    return cleanText
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
  } catch (error) {
    console.error("Error al limpiar HTML:", error)
    return html
  }
}

// Función para extraer el título y la fuente de un título compuesto
function extractTitleAndSource(fullTitle: string): { title: string; source: string } {
  // Patrones comunes: "Título - Fuente" o "Título | Fuente"
  const separators = [" - ", " | ", " :: ", " – ", " — ", " // "]

  for (const separator of separators) {
    if (fullTitle.includes(separator)) {
      const parts = fullTitle.split(separator)
      if (parts.length >= 2) {
        return {
          title: parts[0].trim(),
          source: parts[parts.length - 1].trim(),
        }
      }
    }
  }

  // Si no hay separador, devolver el título completo
  return {
    title: fullTitle,
    source: "",
  }
}

// Función para obtener imágenes de artículos
async function getArticleImage(url: string): Promise<string | null> {
  try {
    // Check if it's a Google News URL - these typically fail with 400 errors
    if (url.includes("news.google.com")) {
      console.log(`Skipping image fetch for Google News URL: ${url}`)
      return null // Skip fetching for Google News URLs
    }

    // For other URLs, try to fetch with a timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.log(`Failed to fetch image for ${url}: ${response.status}`)
      return null
    }

    const html = await response.text()
    const root = parse(html)

    // Try to find the image using various methods
    // 1. Open Graph image
    const metaOgImage = root.querySelector('meta[property="og:image"]')
    if (metaOgImage) {
      const imageUrl = metaOgImage.getAttribute("content")
      if (imageUrl && imageUrl.startsWith("http")) {
        return imageUrl
      }
    }

    // 2. Twitter image
    const metaTwitterImage = root.querySelector('meta[name="twitter:image"]')
    if (metaTwitterImage) {
      const imageUrl = metaTwitterImage.getAttribute("content")
      if (imageUrl && imageUrl.startsWith("http")) {
        return imageUrl
      }
    }

    // 3. Look for large images in the content
    const images = root.querySelectorAll("img")
    for (const img of images) {
      const src = img.getAttribute("src")
      const dataSrc = img.getAttribute("data-src")
      const imgUrl = dataSrc || src

      if (imgUrl && imgUrl.startsWith("http") && !imgUrl.includes("logo") && !imgUrl.includes("icon")) {
        // Check if the image is large enough
        const width = img.getAttribute("width")
        const height = img.getAttribute("height")

        if ((width && Number.parseInt(width) > 300) || (height && Number.parseInt(height) > 200)) {
          return imgUrl
        }
      }
    }

    return null
  } catch (error) {
    console.log(`Error fetching image for ${url}: ${error instanceof Error ? error.message : String(error)}`)
    return null
  }
}

// Función para determinar las etiquetas basadas en el título y resumen
function determineTags(title: string, description: string): string[] {
  const text = (title + " " + description).toLowerCase()
  const tags: string[] = ["venezuela"]

  // Añadir categorías basadas en palabras clave
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      tags.push(category)
    }
  }

  // Asegurarse de que siempre tenga al menos la etiqueta "economía"
  if (!tags.includes("economia")) {
    tags.push("economia")
  }

  return tags
}

// Función auxiliar para obtener categoría segura
function getSafeCategory(tags: string[]): FallbackImageKey {
  const validCategories = Object.keys(FALLBACK_IMAGES) as FallbackImageKey[];
  for (const tag of tags) {
    if (validCategories.includes(tag as FallbackImageKey)) {
      return tag as FallbackImageKey;
    }
  }
  return "default";
}

// Mejorar la función getGoogleNewsRSS para manejar mejor los errores y reintentos
export async function getGoogleNewsRSS(category = "general", limit = 10): Promise<NewsArticle[]> {
  const maxRetries = 3
  let retryCount = 0

  while (retryCount < maxRetries) {
    try {
      const url = GOOGLE_NEWS_RSS_URLS[category] || GOOGLE_NEWS_RSS_URLS.general

      console.log(`Intento ${retryCount + 1}/${maxRetries}: Obteniendo noticias de: ${url}`)

      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        cache: "no-store",
        next: { revalidate: 0 },
      })

      if (!response.ok) {
        throw new Error(`Error al obtener RSS: ${response.status}`)
      }

      const xml = await response.text()

      // Verificar que el XML no esté vacío
      if (!xml || xml.trim() === "") {
        throw new Error("Respuesta XML vacía")
      }

      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
      })

      const result = parser.parse(xml)

      // Verificar que la estructura del RSS sea la esperada
      if (!result.rss || !result.rss.channel || !result.rss.channel.item) {
        console.error("Estructura RSS inesperada:", JSON.stringify(result).substring(0, 200))
        throw new Error("Estructura RSS inesperada")
      }

      const items = result.rss.channel.item

      if (!items || items.length === 0) {
        throw new Error("No se encontraron artículos en el feed RSS")
      }

      // Procesar los artículos
      const articles = await Promise.all(
        (Array.isArray(items) ? items : [items]).slice(0, limit).map(async (item, index) => {
          try {
            // Limpiar el título y extraer la fuente si está presente
            const fullTitle = cleanHtml(item.title || "Sin título")
            const { title, source: extractedSource } = extractTitleAndSource(fullTitle)

            const link = item.link || ""
            const pubDate = item.pubDate || new Date().toISOString()
            const description = cleanHtml(item.description || "")
            const source = extractedSource || item.source?.["#text"] || "Google News"

            // Intentar obtener una imagen para el artículo
            let imageUrl = ""
            try {
              const fetchedImageUrl = await getArticleImage(link)
              if (fetchedImageUrl) {
                imageUrl = fetchedImageUrl
              } else {
                // Use a category-based fallback image
                const tags = determineTags(title, description)
                const category = getSafeCategory(tags)
                imageUrl = FALLBACK_IMAGES[category]
              }
            } catch (imgError) {
              console.error(`Error al obtener imagen para ${link}:`, imgError)
              // Use a category-based fallback image
              const tags = determineTags(title, description)
              const category = getSafeCategory(tags)
              imageUrl = FALLBACK_IMAGES[category]
            }

            // Determinar las etiquetas
            const tags = determineTags(title, description)

            return {
              id: `gnews-${category}-${index}-${Date.now()}`,
              title,
              summary: description || "Sin descripción disponible",
              content:
                description ||
                "Contenido no disponible. Haz clic para leer el artículo completo en la fuente original.",
              date: new Date(pubDate).toISOString(),
              source,
              sourceUrl: link,
              imageUrl,
              tags,
            }
          } catch (itemError) {
            console.error("Error al procesar artículo:", itemError)
            // Devolver un artículo genérico en caso de error
            return {
              id: `gnews-error-${index}-${Date.now()}`,
              title: "Noticia de Venezuela",
              summary: "Información sobre la economía venezolana",
              content: "Contenido no disponible. Haz clic para leer el artículo completo en la fuente original.",
              date: new Date().toISOString(),
              source: "Google News",
              sourceUrl: "",
              imageUrl: `https://via.placeholder.com/800x400?text=Noticia+de+Venezuela`,
              tags: ["venezuela", "economia"],
            }
          }
        }),
      )

      return articles
    } catch (error) {
      console.error(`Intento ${retryCount + 1}/${maxRetries} - Error al obtener noticias de Google News RSS:`, error)
      retryCount++

      if (retryCount >= maxRetries) {
        console.error("Se agotaron los reintentos para obtener noticias de Google News")
        return []
      }

      // Esperar antes de reintentar (backoff exponencial)
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, retryCount)))
    }
  }

  return []
}

// Función para obtener noticias de Google News usando scraping (alternativa)
export async function getGoogleNewsScraping(query = "venezuela economia", limit = 10): Promise<NewsArticle[]> {
  try {
    // URL de Google News para Venezuela
    const url = `https://news.google.com/search?q=${encodeURIComponent(query)}&hl=es-419&gl=VE&ceid=VE:es-419`

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      next: { revalidate: 3600 }, // Revalidar cada hora
    })

    if (!response.ok) {
      throw new Error(`Error al obtener Google News: ${response.status}`)
    }

    const html = await response.text()
    const root = parse(html)

    // Seleccionar los artículos
    const articleElements = root.querySelectorAll("article")
    const articles: NewsArticle[] = []

    for (let i = 0; i < Math.min(articleElements.length, limit); i++) {
      const article = articleElements[i]

      // Extraer información del artículo
      const titleElement = article.querySelector("h3")
      const title = titleElement ? cleanHtml(titleElement.text.trim()) : "Sin título"

      const linkElement = article.querySelector("a")
      const relativeLink = linkElement ? linkElement.getAttribute("href") : ""
      const link = relativeLink ? `https://news.google.com${relativeLink.replace("./", "/")}` : ""

      const timeElement = article.querySelector("time")
      const pubDate = timeElement ? timeElement.getAttribute("datetime") : ""

      const sourceElement = article.querySelector('div[data-n-tid="9"]')
      const source = sourceElement ? cleanHtml(sourceElement.text.trim()) : "Google News"

      // Intentar obtener una imagen
      const imageElement = article.querySelector("img")
      let imageUrl = imageElement ? imageElement.getAttribute("src") : null

      if (!imageUrl || !imageUrl.startsWith("http")) {
        const encodedTitle = encodeURIComponent(title.substring(0, 30))
        imageUrl = `https://via.placeholder.com/800x400?text=${encodedTitle}`
      }

      // Determinar las etiquetas
      const tags = determineTags(title, "")

      articles.push({
        id: `gnews-scrape-${i}-${Date.now()}`,
        title,
        summary: "Haz clic para leer más sobre esta noticia.",
        content: "Contenido no disponible. Haz clic para leer el artículo completo en la fuente original.",
        date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        source,
        sourceUrl: link,
        imageUrl,
        tags,
      })

      if (articles.length >= limit) break
    }

    return articles
  } catch (error) {
    console.error("Error al obtener noticias mediante scraping:", error)
    return []
  }
}
