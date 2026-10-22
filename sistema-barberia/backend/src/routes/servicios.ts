// Catálogo de servicios (épica E2)
// Lectura pública + escritura solo para administradores
import { Elysia, t } from 'elysia'
import { sb } from '../lib/supabase'
import { requiereAdmin } from '../lib/auth'

const esquemaServicio = t.Object({
  nombre: t.String({ minLength: 2 }),
  descripcion: t.Optional(t.String()),
  precio: t.Number({ minimum: 0 }),
  duracion_min: t.Integer({ minimum: 5 }),
  // activo se acepta para el botón activar/desactivar (HU-12/HU-13)
  activo: t.Optional(t.Boolean()),
})

// Para ediciones parciales (ej. solo cambiar `activo`)
const esquemaServicioParcial = t.Partial(esquemaServicio)

export const serviciosPublicos = new Elysia({ name: 'servicios-publicos', prefix: '/api' })
  // GET /api/servicios — catálogo activo (público)
  .get(
    '/servicios',
    async ({ status }) => {
      const { data, error: dbError } = await sb
        .from('servicios')
        .select('*')
        .eq('activo', true)
        .order('nombre')

      if (dbError) return status(500, { error: dbError.message })
      return data
    },
    { detail: { tags: ['Servicios'], summary: 'Listar servicios activos (público)' } }
  )

export const serviciosAdmin = new Elysia({ name: 'servicios-admin', prefix: '/api' })
  .use(requiereAdmin)

  // GET /api/servicios/admin — listado completo para administración
  .get(
    '/servicios/admin',
    async ({ error }) => {
      const { data, error: dbError } = await sb
        .from('servicios')
        .select('*')
        .order('nombre')

      if (dbError) return error(500, { error: dbError.message })
      return data
    },
    { detail: { tags: ['Servicios'], summary: 'Listar TODOS los servicios (admin)' } }
  )

  // POST /api/servicios — crear servicio (HU-11)
  .post(
    '/servicios',
    async ({ body, status }) => {
      const { data, error: dbError } = await sb
        .from('servicios')
        .insert(body)
        .select('*')
        .single()

      if (dbError) return status(400, { error: dbError.message })
      return data
    },
    { body: esquemaServicio, detail: { tags: ['Servicios'], summary: 'Crear servicio (admin)' } }
  )

  // PUT /api/servicios/:id — editar servicio (HU-12)
  .put(
    '/servicios/:id',
    async ({ params, body, status }) => {
      const { data, error: dbError } = await sb
        .from('servicios')
        .update(body)
        .eq('id', params.id)
        .select('*')

      if (dbError) return status(400, { error: dbError.message })
      const actualizado = data?.[0]
      if (!actualizado) return status(404, { error: 'Servicio no encontrado' })
      return actualizado
    },
    { body: esquemaServicioParcial, detail: { tags: ['Servicios'], summary: 'Editar servicio (admin)' } }
  )

  // DELETE /api/servicios/:id — borrado lógico, conserva el historial (HU-13)
  .delete(
    '/servicios/:id',
    async ({ params, status }) => {
      const { data, error: dbError } = await sb
        .from('servicios')
        .update({ activo: false })
        .eq('id', params.id)
        .select('id, activo')

      if (dbError) return status(400, { error: dbError.message })
      if (!data?.[0]) return status(404, { error: 'Servicio no encontrado' })
      return { mensaje: 'Servicio eliminado correctamente' }
    },
    { detail: { tags: ['Servicios'], summary: 'Desactivar servicio (admin)' } }
  )
