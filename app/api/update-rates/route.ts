import { NextResponse } from "next/server"
import { verifyToken, extractTokenFromRequest } from "@/config/auth"
import path from "path"
import fs from "fs"

// Ruta al archivo de tasas
const RATES_FILE_PATH = path.join(process.cwd(), "data", "exchange-rate.json")

// Valores por defecto
const DEFAULT_RATES = {
  standardRate: 72.5,
  premiumRate: 73.5,
  lastUpdated: new Date().toISOString(),
}

export async function POST(request) {
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

    // Preparar datos para guardar
    const dataToSave = {
      standardRate,
      premiumRate,
      lastUpdated: new Date().toISOString(),
    }

    // Asegurar que el directorio existe
    const dirPath = path.dirname(RATES_FILE_PATH)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }

    // Guardar datos directamente
    try {
      fs.writeFileSync(RATES_FILE_PATH, JSON.stringify(dataToSave, null, 2))

      // Actualizar localStorage a través de la respuesta
      return NextResponse.json({
        success: true,
        ...dataToSave,
      })
    } catch (writeError) {
      console.error("Error al escribir archivo:", writeError)

      // Intentar un enfoque alternativo: usar un archivo temporal
      try {
        const tempFilePath = path.join(dirPath, `temp-${Date.now()}.json`)
        fs.writeFileSync(tempFilePath, JSON.stringify(dataToSave, null, 2))

        if (fs.existsSync(RATES_FILE_PATH)) {
          fs.unlinkSync(RATES_FILE_PATH)
        }

        fs.renameSync(tempFilePath, RATES_FILE_PATH)

        return NextResponse.json({
          success: true,
          ...dataToSave,
        })
      } catch (tempError) {
        console.error("Error al usar archivo temporal:", tempError)
        return NextResponse.json(
          {
            success: false,
            message: "Error al guardar las tasas",
            details: tempError.message,
          },
          { status: 500 },
        )
      }
    }
  } catch (error) {
    console.error("Error en POST /api/update-rates:", error)
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
