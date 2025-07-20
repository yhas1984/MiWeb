import Link from "next/link"
import { Mail, MapPin, MessageCircle, Instagram } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function ContactSection() {
  return (
    <section id="contact" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Contáctanos</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Estamos aquí para ayudarte con tus cambios de divisas. No dudes en contactarnos por cualquiera de estos
            medios.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="shadow-md">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Información de Contacto</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-amber-500 mt-1 mr-3" />
                  <div>
                    <p className="font-medium">Dirección</p>
                    <p className="text-gray-600">VYE PARTNERS LLC
131 Continental Drive Suite 305 Newark New Castle Delaware 19713</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-amber-500 mt-1 mr-3" />
                  <div>
                    <p className="font-medium">Email</p>
                    <a href="mailto:contacto@tuenvioexpress.es" className="text-amber-600 hover:underline">
                      contacto@tuenvioexpress.es
                    </a>
                  </div>
                </div>
                <div className="flex items-start">
                  <MessageCircle className="h-5 w-5 text-amber-500 mt-1 mr-3" />
                  <div>
                    <p className="font-medium">WhatsApp</p>
                    <a
                      href="https://api.whatsapp.com/send/?phone=34643670541&text=Hola%2C%20He%20rellenado%20el%20formulario"
                      className="text-amber-600 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      +34 643 670 541
                    </a>
                  </div>
                </div>
                <div className="flex items-start">
                  <Instagram className="h-5 w-5 text-amber-500 mt-1 mr-3" />
                  <div>
                    <p className="font-medium">Instagram</p>
                    <a
                      href="https://www.instagram.com/tuenvioexpress.es?igsh=eW9oNzZxN2d5aHpj"
                      className="text-amber-600 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      @tuenvioexpress.es
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Registro de Usuario</h3>
              <p className="text-gray-600 mb-6">
                Los nuevos usuarios deben completar un formulario con sus datos para comenzar a utilizar nuestros
                servicios de cambio de divisas y obtener una tasa preferencial.
              </p>
              <Button asChild className="w-full bg-amber-500 hover:bg-amber-600">
                <Link href="/registro">Completar Formulario</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
