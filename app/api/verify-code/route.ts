import { type NextRequest, NextResponse } from "next/server"
import { verifyOTP } from "@/services/verification-service-supabase"
import { sendVerificationEmail } from "@/services/email-service"

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        {
          success: false,
          message: "Email y código son requeridos",
        },
        { status: 400 },
      )
    }

    const normalizedEmail = email.toLowerCase()
    console.log(`Verificando código para ${normalizedEmail}: ${code}`)

    // Verificar el código usando el servicio de Supabase
    const result = await verifyOTP(normalizedEmail, code)

    if (result.success) {
      // Enviar notificación por email al administrador
      try {
        const adminEmail = "contacto@tuenvioexpress.es"
        await sendVerificationEmail(
          adminEmail,
          "Administrador",
          "",
          `ADMIN-NOTIFY: El usuario ${email} ha verificado su cuenta exitosamente a las ${new Date().toLocaleString("es-ES")}. Este usuario ahora tiene acceso a la tasa preferencial.`,
        )
      } catch (emailError) {
        console.error("Error al enviar email de notificación al administrador:", emailError)
        // No fallamos la verificación si falla el email al admin
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error al verificar código:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error al procesar la verificación",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
