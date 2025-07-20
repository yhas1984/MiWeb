import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, extractTokenFromRequest } from "@/config/auth"

export async function GET(request: NextRequest) {
  // Verificar autenticación de administrador
  const token = extractTokenFromRequest(request)
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ success: false, message: "No autorizado" }, { status: 401 })
  }

  // Verificar configuraciones
  const jwtSecret = process.env.JWT_SECRET || ""
  const useMockNews = process.env.USE_MOCK_NEWS === "true"

  return NextResponse.json({
    success: true,
    config: {
      jwt: {
        secretConfigured: !!jwtSecret,
        secretLength: jwtSecret ? jwtSecret.length : 0,
      },
      mockNews: useMockNews,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV || "unknown",
      },
    },
  })
}
