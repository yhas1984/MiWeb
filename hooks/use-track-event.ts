"use client"

import { useCallback } from "react"
import { track } from "@vercel/analytics"

export function useTrackEvent() {
  const trackEvent = useCallback((eventName: string, properties?: Record<string, string | number | boolean>) => {
    track(eventName, properties)
  }, [])

  return trackEvent
}
