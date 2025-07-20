import Link from "next/link"
import { Instagram, Mail, MessageCircle } from "lucide-react"

// URL del logo (actualizada para asegurar que funcione)
const LOGO_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-03-05%20at%2015.49.43-uEHU6vvrZTFLABzyO55Lhcb201Bdkx.jpeg"

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative h-10 w-10 bg-white rounded-full p-1 overflow-hidden">
                {/* Usar un div con background-image en lugar de Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${LOGO_URL})` }}
                  aria-label="Tu Envio Express Logo"
                ></div>
              </div>
              <span className="font-bold text-xl">Tu Envio Express</span>
            </div>
            <p className="text-gray-400 mb-4">
              VYE PARTNERS LLC
              <br />
              131 Continental Drive Suite 305 Newark New Castle Delaware 19713
            </p>
            <div className="flex space-x-4">
              <Link
                href="https://www.instagram.com/tuenvioexpress.es?igsh=eW9oNzZxN2d5aHpj"
                className="text-gray-400 hover:text-amber-400"
              >
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link
                href="https://api.whatsapp.com/send/?phone=34643670541&text=Hola%2C%20Quiero%20enviar%20una%20remesa"
                className="text-gray-400 hover:text-amber-400"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="sr-only">WhatsApp</span>
              </Link>
              <Link href="mailto:contacto@tuenvioexpress.es" className="text-gray-400 hover:text-amber-400">
                <Mail className="h-5 w-5" />
                <span className="sr-only">Email</span>
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-amber-400">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="#services" className="text-gray-400 hover:text-amber-400">
                  Servicios
                </Link>
              </li>
              <li>
                <Link href="#about" className="text-gray-400 hover:text-amber-400">
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link href="/chat" className="text-gray-400 hover:text-amber-400">
                  Chat
                </Link>
              </li>
              <li>
                <Link href="#contact" className="text-gray-400 hover:text-amber-400">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/registro" className="text-gray-400 hover:text-amber-400">
                  Registro
                </Link>
              </li>
              <li>
                <Link href="/noticias" className="text-gray-400 hover:text-amber-400">
                  Noticias
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Horario de Atención</h3>
            <ul className="space-y-2 text-gray-400">
              <li>Lunes - Domingo: 8:00 - 23:00</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} Tu Envio Express. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
