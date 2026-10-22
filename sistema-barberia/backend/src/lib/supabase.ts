// Capa de datos: Supabase (PostgreSQL) en producción, almacén local
// JSON en "modo demo" cuando faltan las credenciales. Ambos exponen
// la misma interfaz `sb.from(...)` usada por todas las rutas.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { almacenLocal } from './local'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

/** true cuando no hay credenciales: los datos viven en data/db.json */
export const modoLocal = !url || !key

export const sb: SupabaseClient | typeof almacenLocal = modoLocal
  ? almacenLocal
  : createClient(url!, key!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

if (modoLocal) {
  console.log(
    '✂  MODO DEMO LOCAL: no hay credenciales de Supabase.\n' +
      '   Los datos se guardan en backend/data/db.json (el seed se ejecuta solo).\n' +
      '   Para usar PostgreSQL real: copia .env.example como .env y completa tus claves.'
  )
}

// La service_role key omite RLS: SOLO debe vivir en el backend.
