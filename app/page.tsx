import Link from "next/link"
import { ExchangeRate } from "@/components/exchange-rate"
import { ContactSection } from "@/components/contact-section"
import { AboutSection } from "@/components/about-section"
import { ServicesSection } from "@/components/services-section"
import { NewsSection } from "@/components/news-section"
import { Button } from "@/components/ui/button"
import { CurrencyConverter } from "@/components/currency-converter"
import { RatesInitializer } from "@/components/rates-initializer"
import { Suspense } from "react"

// URL del logo (actualizada para asegurar que funcione)
const LOGO_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-03-05%20at%2015.49.43-uEHU6vvrZTFLABzyO55Lhcb201Bdkx.jpeg"

export default function Home() {
  // Valores predeterminados para el renderizado del servidor
  const standardRate = 72
  const premiumRate = 73
  const lastUpdated = new Date().toISOString()

  return (
    <div className="flex min-h-screen flex-col">
      {/* Inicializador de tasas (componente invisible) */}
      <Suspense fallback={null}>
        <RatesInitializer standardRate={standardRate} premiumRate={premiumRate} lastUpdated={lastUpdated} />
      </Suspense>

      {/* Hero Section */}
      <section className="relative bg-black text-white">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="grid gap-8 md:grid-cols-2 md:gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                <span className="text-amber-400">Envíos</span> rápidos y seguros
              </h1>
              <p className="text-lg text-gray-300 md:text-xl">
                Tu Envio Express ofrece servicios de cambio de divisas confiables entre Europa y Venezuela.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-amber-400 hover:bg-amber-500 text-black">
                  <Link href="#contact">Contáctanos</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-amber-400 text-amber-400 hover:bg-amber-400/10"
                >
                  <Link href="/registro">Registro de Usuario</Link>
                </Button>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden">
                {/* Usar un div con background-image en lugar de Image */}
                <div
                  className="absolute inset-0 bg-contain bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${LOGO_URL})` }}
                  aria-label="Tu Envio Express Logo"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Exchange Rate Section */}
      <section className="bg-amber-50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Pasar los datos serializados como props */}
            <Suspense fallback={<div className="h-40 flex items-center justify-center">Cargando tasas...</div>}>
              <ExchangeRate initialRate={premiumRate} />
            </Suspense>
            <Suspense fallback={<div className="h-40 flex items-center justify-center">Cargando conversor...</div>}>
              <CurrencyConverter initialStandardRate={standardRate} initialPremiumRate={premiumRate} />
            </Suspense>
          </div>
        </div>
      </section>

      {/* About Section */}
      <AboutSection />

      {/* Services Section */}
      <ServicesSection />

      {/* News Section */}
      <Suspense fallback={<div className="h-60 flex items-center justify-center">Cargando noticias...</div>}>
        <NewsSection />
      </Suspense>

      {/* Contact Section */}
      <ContactSection />
    </div>
  )
}
