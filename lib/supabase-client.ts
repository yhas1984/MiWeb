import { createClient } from "@supabase/supabase-js"

// Crear un cliente de Supabase para el lado del cliente
const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  return createClient(supabaseUrl, supabaseAnonKey)
}

// Singleton para el cliente de Supabase
let supabaseClient: ReturnType<typeof createClient> | null = null

// Obtener el cliente de Supabase (singleton)
export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient()
  }
  return supabaseClient
}

// Crear un cliente de Supabase para el lado del servidor
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL || ""
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

  return createClient(supabaseUrl, supabaseServiceKey)
}
