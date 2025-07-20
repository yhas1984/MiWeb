import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth-utils"
import { validateRates, saveRatesToSupabase, getRatesFromSupabase } from "@/lib/rates-service-supabase"

// Extraer token de los headers de la solicitud
const extractTokenFromRequest = (request: NextRequest): string | null => {
  const authHeader = request.headers.get("Authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  return authHeader.split(" ")[1]
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = extractTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ success: false, message: "No autorizado" }, { status: 401 })
    }

    const isValid = await verifyToken(token)
    if (!isValid) {
      return NextResponse.json({ success: false, message: "Token inválido o expirado" }, { status: 401 })
    }

    // Obtener datos de la solicitud
    const data = await request.json()
    const { standardRate, premiumRate } = data

    // Validar datos
    const validation = validateRates(standardRate, premiumRate)
    const { valid, rates, message } = validation;

    if (!valid) {
      return NextResponse.json(
        {
          success: false,
          message: message,
        },
        { status: 400 },
      )
    }

    // Asegurar que las tasas están definidas cuando valid=true
    if (!rates) {
      return NextResponse.json(
        {
          success: false,
          message: "Error interno: datos de tasas no disponibles",
        },
        { status: 500 },
      )
    }

    // Guardar tasas en Supabase
    const saved = await saveRatesToSupabase(rates, true)

    if (!saved) {
      return NextResponse.json(
        {
          success: false,
          message: "Error al guardar las tasas",
        },
        { status: 500 },
      )
    }

    // Crear objeto con las nuevas tasas
    const newRates = {
      standardRate: rates.standardRate,
      premiumRate: rates.premiumRate,
      lastUpdated: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      ...newRates,
    })
  } catch (error) {
    console.error("Error al actualizar tasas:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const rates = await getRatesFromSupabase()
    return NextResponse.json(rates)
  } catch (error) {
    console.error("Error al obtener tasas:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Error desconocido",
        standardRate: 72.5,
        premiumRate: 73.5,
        lastUpdated: "2023-01-01T00:00:00.000Z", // Fecha antigua para que localStorage tenga prioridad
      },
      { status: 500 },
    )
  }
}