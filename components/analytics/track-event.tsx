"use client"

import { useEffect } from "react"
import { track } from "@vercel/analytics"

interface TrackEventProps {
  eventName: string
  properties?: Record<string, string | number | boolean>
  once?: boolean
}

export function TrackEvent({ eventName, properties, once = false }: TrackEventProps) {
  useEffect(() => {
    // Si once es true, verificamos si el evento ya se ha rastreado
    const eventKey = `tracked_${eventName}`

    if (once) {
      const hasTracked = localStorage.getItem(eventKey)
      if (hasTracked) return
    }

    // Rastrear el evento
    track(eventName, properties)

    // Si once es true, marcamos el evento como rastreado
    if (once) {
      localStorage.setItem(eventKey, "true")
    }
  }, [eventName, properties, once])

  // Este componente no renderiza nada visible
  return null
}
