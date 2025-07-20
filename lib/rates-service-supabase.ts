import { getSupabaseClient } from "./supabase-client"
import { createServerSupabaseClient } from "./supabase-client"

// Valores por defecto
const DEFAULT_RATES = {
  standardRate: 72.5,
  premiumRate: 73.5,
  lastUpdated: new Date().toISOString(),
}

// Nombre de la tabla en Supabase
const RATES_TABLE = "exchange_rates"

/**
 * Obtiene las tasas actuales de Supabase
 */
export const getRatesFromSupabase = async () => {
  try {
    const supabase = getSupabaseClient()

    // Verificar si supabase es nulo
    if (!supabase) {
      console.error("Error: Cliente Supabase no disponible")
      return DEFAULT_RATES
    }

    // Obtener la última tasa
    const { data, error } = await supabase
      .from(RATES_TABLE)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error("Error al obtener tasas de Supabase:", error)
      return DEFAULT_RATES
    }

    if (!data) {
      console.log("No hay tasas en Supabase, usando valores predeterminados")
      return DEFAULT_RATES
    }

    return {
      standardRate: data.standard_rate,
      premiumRate: data.premium_rate,
      lastUpdated: data.created_at,
    }
  } catch (error) {
    console.error("Error al obtener tasas de Supabase:", error)
    return DEFAULT_RATES
  }
}

/**
 * Guarda las tasas en Supabase
 */
export const saveRatesToSupabase = async (rates: { standardRate: number; premiumRate: number }, isServer = false) => {
  try {
    // Usar el cliente adecuado según el contexto
    const supabase = isServer ? createServerSupabaseClient() : getSupabaseClient()

    // Verificar si supabase es nulo
    if (!supabase) {
      console.error("Error: Cliente Supabase no disponible")
      return false
    }

    const { data, error } = await supabase
      .from(RATES_TABLE)
      .insert([
        {
          standard_rate: rates.standardRate,
          premium_rate: rates.premiumRate,
        },
      ])
      .select()

    if (error) {
      console.error("Error al guardar tasas en Supabase:", error)
      return false
    }

    console.log("Tasas guardadas en Supabase:", data)
    return true
  } catch (error) {
    console.error("Error al guardar tasas en Supabase:", error)
    return false
  }
}

/**
 * Valida que las tasas sean correctas
 */
export const validateRates = (standardRate: any, premiumRate: any) => {
  // Convertir a números y validar
  const standardRateNum = Number(standardRate)
  const premiumRateNum = Number(premiumRate)

  if (isNaN(standardRateNum) || isNaN(premiumRateNum)) {
    return {
      valid: false,
      message: "Las tasas deben ser números válidos",
    }
  }

  if (standardRateNum <= 0 || premiumRateNum <= 0) {
    return {
      valid: false,
      message: "Las tasas deben ser mayores que cero",
    }
  }

  if (premiumRateNum <= standardRateNum) {
    return {
      valid: false,
      message: "La tasa premium debe ser mayor que la tasa estándar",
    }
  }

  return {
    valid: true,
    message: "Tasas válidas",
    rates: {
      standardRate: standardRateNum,
      premiumRate: premiumRateNum,
    },
  }
}