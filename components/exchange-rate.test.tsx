import type React from "react"
import { render, screen, act } from "@testing-library/react"
import { ExchangeRate } from "./exchange-rate"
import type { RatesData } from "@/lib/rates-service"

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

// Mock de la función fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ standardRate: 75, premiumRate: 76, lastUpdated: new Date().toISOString() }),
  } as any),
) as jest.Mock

describe("ExchangeRate Component", () => {
  beforeEach(() => {
    ;(global.fetch as jest.Mock).mockClear()
    localStorageMock.clear()
  })

  it("renders initial rates correctly", async () => {
    await act(async () => {
      render(<ExchangeRate initialRate={72} />)
    })

    expect(screen.getByText(/1 EUR/)).toBeInTheDocument()
    expect(screen.getByText(/72 VES/)).toBeInTheDocument()
  })

  it("fetches and updates rates from the API", async () => {
    await act(async () => {
      render(<ExchangeRate />)
    })

    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(screen.getByText(/75 VES/)).toBeInTheDocument()
  })

  it("updates rates when ratesUpdated event is dispatched", async () => {
    let rerender: (ui: React.ReactElement) => void = () => {}
    await act(async () => {
      const renderResult = render(<ExchangeRate initialRate={72} />)
      rerender = renderResult.rerender
    })

    const newRates: RatesData = { standardRate: 80, premiumRate: 81, lastUpdated: new Date().toISOString() }

    await act(async () => {
      window.dispatchEvent(new CustomEvent("ratesUpdated", { detail: newRates }))
    })

    expect(screen.getByText(/80 VES/)).toBeInTheDocument()
  })
})
