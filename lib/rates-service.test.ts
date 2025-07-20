import { getCurrentRates, saveRates, RATES_STORAGE_KEY, type RatesData } from "./rates-service"
import { describe, beforeEach, it, expect } from "vitest"

// Mock del localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {}

  return {
    getItem(key: string) {
      return store[key] || null
    },
    setItem(key: string, value: string) {
      store[key] = String(value)
    },
    removeItem(key: string) {
      delete store[key]
    },
    clear() {
      store = {}
    },
  }
})()

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
})

describe("Rates Service", () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  it("getCurrentRates returns default rates when localStorage is empty", () => {
    const rates = getCurrentRates()
    expect(rates.standardRate).toBe(72.5)
    expect(rates.premiumRate).toBe(73.5)
  })

  it("getCurrentRates returns rates from localStorage when available", () => {
    const ratesData = { standardRate: 75, premiumRate: 76, lastUpdated: new Date().toISOString() }
    localStorageMock.setItem(RATES_STORAGE_KEY, JSON.stringify(ratesData))

    const rates = getCurrentRates()
    expect(rates.standardRate).toBe(75)
    expect(rates.premiumRate).toBe(76)
  })

  it("saveRates saves rates to localStorage", () => {
    const ratesData: RatesData = { standardRate: 78, premiumRate: 79, lastUpdated: new Date().toISOString() }
    saveRates(ratesData)

    const storedRates = localStorageMock.getItem(RATES_STORAGE_KEY)
    expect(storedRates).toEqual(JSON.stringify(ratesData))
  })
})
