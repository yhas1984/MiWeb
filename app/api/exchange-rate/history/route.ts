import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-client"
import { verifyToken, extractTokenFromRequest } from "@/config/auth"

// Solución: Forzar el modo dinámico para esta ruta
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    // Crear cliente de Supabase
    const supabase = createServerSupabaseClient()

    // Obtener historial de tasas de cambio
    const { data, error } = await supabase
      .from("exchange_rate_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) {
      console.error("Error al obtener historial de tasas:", error)
      return NextResponse.json({ success: false, message: "Error al obtener historial de tasas" }, { status: 500 })
    }

    // Transformar los datos para el cliente
    const formattedData = data.map((item) => ({
      id: item.id,
      standardRate: Number(item.standard_rate),
      premiumRate: Number(item.premium_rate),
      createdAt: item.created_at,
      createdBy: item.created_by,
    }))

    return NextResponse.json(formattedData)
  } catch (error) {
    console.error("Error en GET /api/exchange-rate/history:", error)
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
