import { render, screen, fireEvent } from "@testing-library/react"
import { CurrencyConverter } from "./currency-converter"

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

describe("CurrencyConverter Component", () => {
  it("converts EUR to VES correctly with standard rate", () => {
    render(<CurrencyConverter initialStandardRate={72} initialPremiumRate={73} />)

    const euroInput = screen.getByPlaceholderText("0.00") as HTMLInputElement
    fireEvent.change(euroInput, { target: { value: "10" } })

    expect(screen.getByDisplayValue("720.00")).toBeInTheDocument()
  })

  it("converts EUR to VES correctly with premium rate", () => {
    render(<CurrencyConverter initialStandardRate={72} initialPremiumRate={73} />)

    const euroInput = screen.getByPlaceholderText("0.00") as HTMLInputElement
    fireEvent.change(euroInput, { target: { value: "10" } })

    fireEvent.click(screen.getByText("Tasa Premium"))

    expect(screen.getByDisplayValue("730.00")).toBeInTheDocument()
  })

  it("converts VES to EUR correctly with standard rate", () => {
    render(<CurrencyConverter initialStandardRate={72} initialPremiumRate={73} />)

    const bolivarInput = screen.getAllByPlaceholderText("0.00")[1] as HTMLInputElement
    fireEvent.change(bolivarInput, { target: { value: "720" } })

    expect(screen.getByDisplayValue("10.00")).toBeInTheDocument()
  })

  it("converts VES to EUR correctly with premium rate", () => {
    render(<CurrencyConverter initialStandardRate={72} initialPremiumRate={73} />)

    const bolivarInput = screen.getAllByPlaceholderText("0.00")[1] as HTMLInputElement
    fireEvent.change(bolivarInput, { target: { value: "730" } })

    fireEvent.click(screen.getByText("Tasa Premium"))

    expect(screen.getByDisplayValue("10.00")).toBeInTheDocument()
  })
})
