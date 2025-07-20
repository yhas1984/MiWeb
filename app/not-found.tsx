import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-amber-600">404</h1>
          <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl">Página no encontrada</h2>
          <p className="text-gray-500 md:text-lg">
            Lo sentimos, la página que estás buscando no existe o ha sido movida.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Link>
          </Button>
          <Button asChild className="gap-2 bg-amber-500 hover:bg-amber-600">
            <Link href="/contacto">
              <Home className="h-4 w-4" />
              Contactar con nosotros
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
