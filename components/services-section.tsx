import { CreditCard, Repeat, Shield, Clock } from "lucide-react"

export function ServicesSection() {
  return (
    <section id="services" className="py-16 bg-gray-900 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Nuestros Servicios</h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Ofrecemos servicios de cambio de divisas entre Euros (EUR) y Bolívares venezolanos (VES) con las mejores
            tasas del mercado.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-start mb-4">
              <div className="mr-4 bg-amber-500 p-3 rounded-lg">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Cambio de Divisas</h3>
                <p className="text-gray-300">
                  Cambia tus Euros a Bolívares venezolanos con las mejores tasas del mercado y de forma segura.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-start mb-4">
              <div className="mr-4 bg-amber-500 p-3 rounded-lg">
                <Repeat className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Transferencias Rápidas</h3>
                <p className="text-gray-300">
                  Recibe tus Bolívares en cuestión de minutos después de realizar tu operación de cambio.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-start mb-4">
              <div className="mr-4 bg-amber-500 p-3 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Seguridad Garantizada</h3>
                <p className="text-gray-300">
                  Todas nuestras operaciones están protegidas y garantizamos la seguridad de tus transacciones.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-start mb-4">
              <div className="mr-4 bg-amber-500 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Atención Personalizada</h3>
                <p className="text-gray-300">
                  Contamos con un equipo de atención al cliente disponible para resolver todas tus dudas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
