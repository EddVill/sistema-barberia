// Rutas públicas de autenticación: registro e inicio de sesión (HU-01, HU-02)
import { Elysia, t } from 'elysia'
import bcrypt from 'bcryptjs'
import { sb } from '../lib/supabase'
import { jsonWebToken } from '../lib/auth'

// Perú: celulares +51 con 9 dígitos que empiezan con 9
export const PATRON_CELULAR = '^\\+51 ?9\\d{8}$'
export const ERROR_CELULAR =
  'El celular debe ser +51 seguido de 9 dígitos que empiecen con 9 (ej. +51 987654321)'

/** "+51 987654321" → "+51 987 654 321" (formato legible) */
export function normalizarTelefono(telefono: string): string {
  const d = telefono.replace(/[\s-]/g, '')
  return `+51 ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`
}

export const authRoutes = new Elysia({ name: 'rutas-auth', prefix: '/api/auth' })
  .use(jsonWebToken)

  // POST /api/auth/registro — crea cuenta con rol cliente
  .post(
    '/registro',
    async ({ body, jwt, status }) => {
      const { data: existe } = await sb
        .from('usuarios')
        .select('id')
        .eq('email', body.email)
        .maybeSingle()
      if (existe) return status(409, { error: 'El email ya está registrado' })

      const password_hash = await bcrypt.hash(body.password, 10)
      const { data, error: dbError } = await sb
        .from('usuarios')
        .insert({
          nombre: body.nombre,
          email: body.email,
          password_hash,
          telefono: body.telefono ? normalizarTelefono(body.telefono) : null,
          rol: 'cliente',
        })
        .select('id, nombre, email, rol')
        .single()

      if (dbError) return status(500, { error: dbError.message })

      const token = await jwt.sign({
        sub: data.id, email: data.email, nombre: data.nombre, rol: data.rol,
      })
      return { token, usuario: data }
    },
    {
      body: t.Object({
        nombre: t.String({ minLength: 2, error: 'El nombre es obligatorio' }),
        email: t.String({ format: 'email', error: 'Email inválido' }),
        password: t.String({ minLength: 6, error: 'La contraseña debe tener al menos 6 caracteres' }),
        telefono: t.Optional(
          t.String({ pattern: PATRON_CELULAR, error: ERROR_CELULAR })
        ),
      }),
      detail: { tags: ['Autenticación'], summary: 'Registro de cliente (público)' },
    }
  )

  // POST /api/auth/login — devuelve JWT si las credenciales son válidas
  .post(
    '/login',
    async ({ body, jwt, status }) => {
      const { data: usuario, error: dbError } = await sb
        .from('usuarios')
        .select('*')
        .eq('email', body.email)
        .maybeSingle()

      if (dbError) return status(500, { error: dbError.message })
      // Misma respuesta para email inexistente y contraseña incorrecta (HU-04)
      if (!usuario || !(await bcrypt.compare(body.password, usuario.password_hash))) {
        return status(401, { error: 'Credenciales inválidas' })
      }

      const token = await jwt.sign({
        sub: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol,
      })
      return {
        token,
        usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
      }
    },
    {
      body: t.Object({ email: t.String(), password: t.String() }),
      detail: { tags: ['Autenticación'], summary: 'Inicio de sesión (público)' },
    }
  )
