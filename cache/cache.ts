import fs from "fs"
import path from "path"

const CACHE_FILE_PATH = path.join(process.cwd(), "data", "cache.json")

interface Cache {
  queries: {
    [query: string]: {
      tweets: any[]
      timestamp: number
    }
  }
}

const ensureDirectoryExists = (filePath: string) => {
  const dirname = path.dirname(filePath)
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true })
  }
}

export const readCache = (): Cache => {
  try {
    ensureDirectoryExists(CACHE_FILE_PATH)
    if (!fs.existsSync(CACHE_FILE_PATH)) {
      return { queries: {} }
    }
    const data = fs.readFileSync(CACHE_FILE_PATH, "utf8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Error al leer el caché:", error)
    return { queries: {} }
  }
}

export const writeCache = (cache: Cache) => {
  try {
    ensureDirectoryExists(CACHE_FILE_PATH)
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cache, null, 2))
  } catch (error) {
    console.error("Error al escribir en el caché:", error)
  }
}
