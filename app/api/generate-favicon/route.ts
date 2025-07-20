import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import { verifyToken, extractTokenFromRequest } from "@/config/auth"

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = extractTokenFromRequest(request)
    if (!token || !(await verifyToken(token))) {
      return NextResponse.json({ success: false, message: "No autorizado" }, { status: 401 })
    }

    // Ejecutar el script de generación de favicon
    const scriptPath = "scripts/generate-favicon-file.js"
    const { stdout, stderr } = await execAsync(`node ${scriptPath}`)

    if (stderr) {
      console.error("Error al ejecutar script de favicon:", stderr)
      return NextResponse.json({ success: false, message: `Error al generar favicons: ${stderr}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Favicons generados correctamente",
      details: stdout,
    })
  } catch (error) {
    console.error("Error al generar favicons:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error al generar favicons",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
