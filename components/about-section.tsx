import { Shield, Repeat, Clock } from "lucide-react"

// URL del logo (actualizada para asegurar que funcione)
const LOGO_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-03-05%20at%2015.49.43-uEHU6vvrZTFLABzyO55Lhcb201Bdkx.jpeg"

export function AboutSection() {
  return (
    <section id="about" className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Sobre Nosotros</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Tu Envio Express es una empresa especializada en el cambio de divisas entre Europa y Venezuela, ofreciendo
            un servicio rápido, seguro y confiable.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-500 mb-4">
              <Repeat className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Cambios Garantizados</h3>
            <p className="text-gray-600">
              Garantizamos la entrega de tus Bolívares en el tiempo acordado y con la mejor tasa del mercado.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-500 mb-4">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Seguridad Total</h3>
            <p className="text-gray-600">
              Tu dinero está protegido desde el momento de la transacción hasta la entrega final.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-500 mb-4">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Rapidez</h3>
            <p className="text-gray-600">
              Contamos con los mejores tiempos de entrega del mercado para tus cambios de divisas.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-8 shadow-sm">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-4">VYE PARTNERS LLC</h3>
              <p className="text-gray-600 mb-4">
                Somos una empresa registrada en Delaware, U.S.A, dedicada a ofrecer servicios de cambio de divisas
                entre Europa y Venezuela. Nuestro compromiso es brindar un servicio de calidad, transparente y
                eficiente.
              </p>
              <p className="text-gray-600">
                Con años de experiencia en el sector, entendemos las necesidades específicas de nuestros clientes y
                trabajamos constantemente para superar sus expectativas.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="relative w-full max-w-md h-64 md:h-80 rounded-lg overflow-hidden">
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
      </div>
    </section>
  )
}
