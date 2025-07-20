import { createServerSupabaseClient } from "./supabase-client"
import type { User } from "@/models/user"

const LOG_PREFIX = "[USER-SERVICE-SUPABASE]"

/**
 * Busca un usuario por email en Supabase
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    const supabase = createServerSupabaseClient()
    const normalizedEmail = email.toLowerCase()

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle()  // Usar maybeSingle para evitar errores cuando no hay registros

    if (error) {
      console.error(`${LOG_PREFIX} Error al buscar usuario:`, error)
      return null
    }

    if (!data) return null

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      registrationDate: data.registration_date,
      verified: data.verified,
      referredBy: data.referred_by,
    }
  } catch (error) {
    console.error(`${LOG_PREFIX} Error al buscar usuario:`, error)
    return null
  }
}

/**
 * Crea un nuevo usuario en Supabase
 */
export async function createUser(userData: {
  email: string
  name: string
  verified?: boolean
  referredBy?: string
}): Promise<User | null> {
  try {
    const supabase = createServerSupabaseClient()
    const normalizedEmail = userData.email.toLowerCase()

    // Verificar si el usuario ya existe
    const existingUser = await findUserByEmail(normalizedEmail)
    if (existingUser) {
      console.log(`${LOG_PREFIX} Usuario ya existe:`, existingUser)
      return existingUser
    }

    // Crear nuevo usuario
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          email: normalizedEmail,
          name: userData.name,
          verified: userData.verified || false,
          referred_by: userData.referredBy,
          registration_date: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.error(`${LOG_PREFIX} Error al crear usuario:`, error)
      return null
    }

    if (!data || data.length === 0) {
      console.error(`${LOG_PREFIX} No se recibieron datos al crear usuario`)
      return null
    }

    return {
      id: data[0].id,
      email: data[0].email,
      name: data[0].name,
      registrationDate: data[0].registration_date,
      verified: data[0].verified,
      referredBy: data[0].referred_by,
    }
  } catch (error) {
    console.error(`${LOG_PREFIX} Error al crear usuario:`, error)
    return null
  }
}

/**
 * Actualiza un usuario en Supabase
 */
export async function updateUser(email: string, updates: Partial<User>): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient()
    const normalizedEmail = email.toLowerCase()

    const updateData: Record<string, any> = {}
    if (updates.name) updateData.name = updates.name
    if (updates.verified !== undefined) updateData.verified = updates.verified
    if (updates.referredBy) updateData.referred_by = updates.referredBy

    const { error } = await supabase
      .from("users")
      .update(updateData)
      .eq("email", normalizedEmail)

    if (error) {
      console.error(`${LOG_PREFIX} Error al actualizar usuario:`, error)
      return false
    }

    return true
  } catch (error) {
    console.error(`${LOG_PREFIX} Error al actualizar usuario:`, error)
    return false
  }
}

/**
 * Verifica si un usuario está registrado y/o verificado
 */
export async function checkUserStatus(email: string): Promise<{ isRegistered: boolean; verified: boolean }> {
  try {
    const user = await findUserByEmail(email)
    if (!user) {
      return { isRegistered: false, verified: false }
    }

    return { isRegistered: true, verified: user.verified || false }
  } catch (error) {
    console.error(`${LOG_PREFIX} Error al verificar estado de usuario:`, error)
    return { isRegistered: false, verified: false }
  }
}

/**
 * Marca un usuario como verificado - VERSIÓN CORREGIDA
 */
export async function markUserAsVerified(email: string): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient()
    const normalizedEmail = email.toLowerCase()

    // Primero verificar si el usuario existe
    const user = await findUserByEmail(normalizedEmail)
    
    if (!user) {
      console.error(`${LOG_PREFIX} Usuario no encontrado: ${normalizedEmail}`)
      return false
    }

    // Actualizar solo el campo de verificación
    const { error } = await supabase
      .from("users")
      .update({ verified: true })
      .eq("email", normalizedEmail)

    if (error) {
      console.error(`${LOG_PREFIX} Error al actualizar usuario:`, error)
      return false
    }

    console.log(`${LOG_PREFIX} Usuario marcado como verificado: ${normalizedEmail}`)
    return true
  } catch (error) {
    console.error(`${LOG_PREFIX} Error al marcar usuario como verificado:`, error)
    return false
  }
}
