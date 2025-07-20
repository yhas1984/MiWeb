import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

export const formatCurrency = (amount: string | number, currency: string): string => {
  const amountNumber = typeof amount === "string" ? Number.parseFloat(amount) : amount

  if (isNaN(amountNumber)) {
    return "Invalid amount"
  }

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: currency,
  }).format(amountNumber)
}
