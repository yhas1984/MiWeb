"use client"

import { useEffect, useState, type ReactNode } from "react"

interface ClientOnlyProps {
  children: () => ReactNode
  fallback?: ReactNode
}

export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return <>{fallback}</>
  }

  return <>{children()}</>
}

// Hook para usar en componentes que necesitan saber si están montados
export function useHasMounted() {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  return hasMounted
}

// Función para acceder de forma segura a localStorage
export function safeLocalStorage() {
  if (typeof window === "undefined") {
    // Versión simulada de localStorage para SSR
    return {
      getItem: () => null,
      setItem: () => null,
      removeItem: () => null,
    }
  }
  return window.localStorage
}
