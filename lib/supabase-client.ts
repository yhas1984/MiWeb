import { createClient, SupabaseClient } from "@supabase/supabase-js"

// Crear un cliente de Supabase para el lado del cliente
const createSupabaseClient = (): SupabaseClient => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Obtener el cliente de Supabase (crea nueva instancia cada vez)
export const getSupabaseClient = (): SupabaseClient => {
  return createSupabaseClient()
}

// Crear un cliente de Supabase para el lado del servidor
export const createServerSupabaseClient = (): SupabaseClient => {
  const supabaseUrl = process.env.SUPABASE_URL || ""
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  
  return createClient(supabaseUrl, supabaseServiceKey)
}
