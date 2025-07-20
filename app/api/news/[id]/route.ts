import { type NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import type { NewsArticle } from "@/lib/google-news-service"

// Ruta para el archivo de caché
const CACHE_FILE_PATH = path.join(process.cwd(), "data", "news-cache.json")

// Leer caché
const readCache = () => {
  try {
    if (!fs.existsSync(CACHE_FILE_PATH)) {
      return { news: [], timestamp: 0 }
    }
    const data = fs.readFileSync(CACHE_FILE_PATH, "utf8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Error al leer caché:", error)
    return { news: [], timestamp: 0 }
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
      imageUrl: "/images/news/economia.jpg",
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
      imageUrl: "/images/news/tipo-de-cambio.jpg",
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
      imageUrl: "/images/news/regulaciones.jpg",
      tags: ["regulaciones", "casas de cambio", "divisas"],
    },
  ]
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Buscar en caché
    const cache = readCache()
    const cachedNews = cache.news as NewsArticle[]

    // Buscar la noticia por ID
    const article = cachedNews.find((item: NewsArticle) => item.id === id)

    if (article) {
      return NextResponse.json(article)
    }

    // Si no se encuentra en caché, buscar en noticias de respaldo
    const fallbackNews = getFallbackNews()
    const fallbackArticle = fallbackNews.find((item) => item.id === id)

    if (fallbackArticle) {
      return NextResponse.json(fallbackArticle)
    }

    // Si no se encuentra, devolver error 404
    return new NextResponse(JSON.stringify({ error: "Noticia no encontrada" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Error al obtener noticia:", error)
    return new NextResponse(JSON.stringify({ error: "Error al obtener noticia" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }
}
