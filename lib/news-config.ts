// Configuración para la API de noticias
export const NEWS_CONFIG = {
  // Fuentes de noticias confiables
  RELIABLE_SOURCES: [
    "El Universal",
    "Banca y Negocios",
    "El Nacional",
    "El Estímulo",
    "Finanzas Digital",
    "Observatorio Venezolano de Finanzas",
  ],

  // Palabras clave para filtrar noticias relevantes
  RELEVANT_KEYWORDS: [
    "economía",
    "venezuela",
    "bolívar",
    "divisas",
    "tipo de cambio",
    "euro",
    "dólar",
    "inflación",
    "bcv",
    "banco central",
    "remesas",
  ],

  // Configuración de caché
  CACHE_ENABLED: true,
  CACHE_TTL: 2 * 60 * 60 * 1000, // 2 horas en milisegundos

  // Configuración de reintentos
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 segundo

  // Tiempo de timeout para las solicitudes
  REQUEST_TIMEOUT: 10000, // 10 segundos

  // Número máximo de noticias a mostrar
  MAX_NEWS_ITEMS: 20,

  // Imágenes de respaldo por categoría
  FALLBACK_IMAGES: {
    economía: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1000&auto=format&fit=crop",
    "tipo de cambio": "https://images.unsplash.com/photo-1621155346337-1d19476ba7d6?q=80&w=1000&auto=format&fit=crop",
    inflación: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1000&auto=format&fit=crop",
    default: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1000&auto=format&fit=crop",
  },
}
