import { ExchangeRateDashboard } from "@/components/admin/exchange-rate-dashboard"

export default function ExchangeRatesPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Administración de Tasas de Cambio</h1>
      <ExchangeRateDashboard />
    </div>
  )
}
