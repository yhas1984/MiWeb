import { NextResponse, type NextRequest } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-client"
import { verifyToken } from "@/utils/auth"

// Helper function to extract token from request headers
function extractTokenFromRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7) // Remove 'Bearer ' prefix
  }
  return null
}

export async function GET(request: NextRequest) {
  try {
    // Crear cliente de Supabase
    const supabase = createServerSupabaseClient()

    // Obtener tasas actuales
    const { data, error } = await supabase
      .from("exchange_rates")
      .select("*")
      .order("last_updated", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error("Error al obtener tasas:", error)

      // En caso de error, devolver valores predeterminados
      return NextResponse.json({
        standardRate: 72.5,
        premiumRate: 73.5,
        lastUpdated: new Date().toISOString(),
      })
    }

    // Devolver tasas con la fecha real de actualización
    return NextResponse.json({
      standardRate: Number(data.standard_rate),
      premiumRate: Number(data.premium_rate),
      lastUpdated: data.last_updated || new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error al obtener tasas:", error)

    // En caso de error, devolver valores predeterminados
    return NextResponse.json({
      standardRate: 72.5,
      premiumRate: 73.5,
      lastUpdated: new Date().toISOString(),
    })
  }
}

// POST: Actualizar tasas
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = extractTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ success: false, message: "No autorizado" }, { status: 401 })
    }

    const isValid = await verifyToken(token)
    if (!isValid) {
      return NextResponse.json({ success: false, message: "Token inválido" }, { status: 401 })
    }

    // Obtener datos del cuerpo
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("Error al parsear el cuerpo de la solicitud:", parseError)
      return NextResponse.json(
        {
          success: false,
          message: "Formato de solicitud inválido",
        },
        { status: 400 },
      )
    }

    console.log("Datos recibidos para actualizar tasas:", body)

    // Validar datos
    const standardRate = Number(body.standardRate)
    const premiumRate = Number(body.premiumRate)

    if (isNaN(standardRate) || isNaN(premiumRate)) {
      return NextResponse.json(
        {
          success: false,
          message: "Las tasas deben ser números válidos",
        },
        { status: 400 },
      )
    }

    if (standardRate <= 0 || premiumRate <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Las tasas deben ser mayores que cero",
        },
        { status: 400 },
      )
    }

    if (premiumRate <= standardRate) {
      return NextResponse.json(
        {
          success: false,
          message: "La tasa premium debe ser mayor que la tasa estándar",
        },
        { status: 400 },
      )
    }

    // Crear cliente de Supabase
    const supabase = createServerSupabaseClient()

    // 1. Actualizar la tabla exchange_rates
    const { error: updateError } = await supabase
      .from("exchange_rates")
      .update({
        standard_rate: standardRate,
        premium_rate: premiumRate,
        last_updated: new Date().toISOString(),
      })
      .eq("id", 1) // Asumiendo que hay un registro con id=1

    if (updateError) {
      console.error("Error al actualizar tasas:", updateError)

      // Si no existe el registro, intentar insertarlo
      if (updateError.code === "PGRST116") {
        const { error: insertError } = await supabase.from("exchange_rates").insert([
          {
            id: 1,
            standard_rate: standardRate,
            premium_rate: premiumRate,
            last_updated: new Date().toISOString(),
          },
        ])

        if (insertError) {
          console.error("Error al insertar tasas:", insertError)
          return NextResponse.json(
            {
              success: false,
              message: "Error al guardar las tasas",
            },
            { status: 500 },
          )
        }
      } else {
        return NextResponse.json(
          {
            success: false,
            message: "Error al actualizar las tasas",
          },
          { status: 500 },
        )
      }
    }

    // 2. Añadir entrada al historial
    const { error: historyError } = await supabase.from("exchange_rate_history").insert([
      {
        standard_rate: standardRate,
        premium_rate: premiumRate,
        created_at: new Date().toISOString(),
        // Si tienes el ID del usuario, podrías incluirlo aquí
        created_by: null,
      },
    ])

    if (historyError) {
      console.error("Error al guardar historial:", historyError)
      // No fallamos la operación si falla el historial
    }

    // Crear objeto con las nuevas tasas
    const newRates = {
      standardRate: standardRate,
      premiumRate: premiumRate,
      lastUpdated: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      ...newRates,
    })
  } catch (error) {
    console.error("Error en POST /api/exchange-rate:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}