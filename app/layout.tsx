import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/toaster"
import { FloatingChat } from "@/components/floating-chat"
import { AuthProvider } from "@/contexts/auth-context"
import { UserProvider } from "@/contexts/user-context"
import { Analytics } from "@vercel/analytics/react"
import { Inter } from "next/font/google" // Cambiamos a next/font/google

// Configurar la fuente Inter desde Google Fonts
const inter = Inter({ 
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-inter',
})

// URL del logo
const LOGO_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-03-05%20at%2015.49.43-uEHU6vvrZTFLABzyO55Lhcb201Bdkx.jpeg"

export const metadata: Metadata = {
  title: "Tu Envio Express - Cambio de Divisas entre Europa y Venezuela",
  description:
    "Servicios de cambio de divisas entre Europa y Venezuela. Cambia Euros a Bolívares con Tu Envio Express.",
  metadataBase: new URL("https://www.tuenvioexpress.es"),
  openGraph: {
    title: "Tu Envio Express - Cambio de Divisas entre Europa y Venezuela",
    description:
      "Servicios de cambio de divisas entre Europa y Venezuela. Cambia Euros a Bolívares con Tu Envio Express.",
    url: "https://www.tuenvioexpress.es",
    siteName: "Tu Envio Express",
    locale: "es_ES",
    type: "website",
    images: [
      {
        url: LOGO_URL,
        width: 800,
        height: 600,
        alt: "Tu Envio Express Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tu Envio Express - Cambio de Divisas entre Europa y Venezuela",
    description:
      "Servicios de cambio de divisas entre Europa y Venezuela. Cambia Euros a Bolívares con Tu Envio Express.",
    images: [LOGO_URL],
  },
  icons: {
    icon: LOGO_URL,
    shortcut: LOGO_URL,
    apple: LOGO_URL,
  },
  robots: {
    index: true,
    follow: true,
  },
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <head>
        {/* Favicon directo usando la URL del logo */}
        <link rel="icon" href={LOGO_URL} />
        <link rel="apple-touch-icon" href={LOGO_URL} />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            <UserProvider>
              <div className="flex min-h-screen flex-col">
                <Navbar />
                <main className="flex-1">{children}</main>
                <Footer />
                <FloatingChat />
              </div>
              <Toaster />
              <Analytics />
            </UserProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
