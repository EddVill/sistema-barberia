// Perfil del usuario autenticado (HU-06, HU-07)
import { Elysia, t } from 'elysia'
import { sb } from '../lib/supabase'
import { requiereAuth } from '../lib/auth'
import { PATRON_CELULAR, ERROR_CELULAR, normalizarTelefono } from './auth'

export const usuariosRoutes = new Elysia({ name: 'rutas-usuarios', prefix: '/api' })
  .use(requiereAuth)

  // GET /api/perfil — datos del usuario dueño del token
  .get(
    '/perfil',
    async ({ usuario, status }) => {
      const { data, error: dbError } = await sb
        .from('usuarios')
        .select('id, nombre, email, telefono, rol, created_at')
        .eq('id', usuario.sub)
        .single()

      if (dbError) return status(404, { error: 'Usuario no encontrado' })
      return data
    },
    { detail: { tags: ['Usuarios'], summary: 'Ver perfil propio (auth)' } }
  )

  // PUT /api/perfil — actualizar nombre y teléfono
  .put(
    '/perfil',
    async ({ usuario, body, status }) => {
      const { data, error: dbError } = await sb
        .from('usuarios')
        .update({
          nombre: body.nombre,
          telefono: body.telefono ? normalizarTelefono(body.telefono) : null,
        })
        .eq('id', usuario.sub)
        .select('id, nombre, email, telefono, rol')

      if (dbError) return status(400, { error: dbError.message })
      if (!data?.[0]) return status(404, { error: 'Usuario no encontrado' })
      return data[0]
    },
    {
      body: t.Object({
        nombre: t.String({ minLength: 2 }),
        telefono: t.Optional(
          t.String({ pattern: PATRON_CELULAR, error: ERROR_CELULAR })
        ),
      }),
      detail: { tags: ['Usuarios'], summary: 'Editar perfil propio (auth)' },
    }
  )
