// Barberos y horarios de atención (épica E3)
import { Elysia, t } from 'elysia'
import { sb } from '../lib/supabase'
import { requiereAdmin } from '../lib/auth'

const esquemaBarbero = t.Object({
  nombre: t.String({ minLength: 2 }),
  especialidad: t.Optional(t.String()),
  activo: t.Optional(t.Boolean()),
})

const esquemaHorarios = t.Object({
  horarios: t.Array(
    t.Object({
      dia_semana: t.Integer({ minimum: 0, maximum: 6 }),
      hora_inicio: t.String({ pattern: '^\\d{2}:\\d{2}$' }),
      hora_fin: t.String({ pattern: '^\\d{2}:\\d{2}$' }),
    })
  ),
})

export const barberosPublicos = new Elysia({ name: 'barberos-publicos', prefix: '/api' })
  // GET /api/barberos — equipo activo con sus horarios (público, HU-14)
  .get(
    '/barberos',
    async ({ status }) => {
      const { data, error: dbError } = await sb
        .from('barberos')
        .select('*, horarios(dia_semana, hora_inicio, hora_fin)')
        .eq('activo', true)
        .order('nombre')

      if (dbError) return status(500, { error: dbError.message })
      return data
    },
    { detail: { tags: ['Barberos'], summary: 'Listar barberos activos (público)' } }
  )

export const barberosAdmin = new Elysia({ name: 'barberos-admin', prefix: '/api' })
  .use(requiereAdmin)

  // GET /api/barberos/admin — listado completo para administración
  .get(
    '/barberos/admin',
    async ({ error }) => {
      const { data, error: dbError } = await sb
        .from('barberos')
        .select('*, horarios(dia_semana, hora_inicio, hora_fin)')
        .order('nombre')

      if (dbError) return error(500, { error: dbError.message })
      return data
    },
    { detail: { tags: ['Barberos'], summary: 'Listar TODOS los barberos (admin)' } }
  )

  // POST /api/barberos — registrar barbero (HU-16)
  .post(
    '/barberos',
    async ({ body, status }) => {
      const { data, error: dbError } = await sb
        .from('barberos')
        .insert(body)
        .select('*')
        .single()

      if (dbError) return status(400, { error: dbError.message })
      return data
    },
    { body: esquemaBarbero, detail: { tags: ['Barberos'], summary: 'Crear barbero (admin)' } }
  )

  // PUT /api/barberos/:id — editar barbero (HU-17)
  .put(
    '/barberos/:id',
    async ({ params, body, status }) => {
      const { data, error: dbError } = await sb
        .from('barberos')
        .update(body)
        .eq('id', params.id)
        .select('*')

      if (dbError) return status(400, { error: dbError.message })
      const actualizado = data?.[0]
      if (!actualizado) return status(404, { error: 'Barbero no encontrado' })
      return actualizado
    },
    { body: esquemaBarbero, detail: { tags: ['Barberos'], summary: 'Editar barbero (admin)' } }
  )

  // DELETE /api/barberos/:id — desactivación lógica (HU-19)
  .delete(
    '/barberos/:id',
    async ({ params, status }) => {
      const { data, error: dbError } = await sb
        .from('barberos')
        .update({ activo: false })
        .eq('id', params.id)
        .select('id, activo')

      if (dbError) return status(400, { error: dbError.message })
      if (!data?.[0]) return status(404, { error: 'Barbero no encontrado' })
      return { mensaje: 'Barbero eliminado correctamente' }
    },
    { detail: { tags: ['Barberos'], summary: 'Desactivar barbero (admin)' } }
  )

  // PUT /api/barberos/:id/horarios — reemplaza la semana completa (HU-18)
  .put(
    '/barberos/:id/horarios',
    async ({ params, body, status }) => {
      // Validar que el barbero exista
      const { data: barbero } = await sb
        .from('barberos')
        .select('id')
        .eq('id', params.id)
        .single()
      if (!barbero) return status(404, { error: 'Barbero no encontrado' })

      // Borrar horarios anteriores e insertar los nuevos
      await sb.from('horarios').delete().eq('barbero_id', params.id)
      const filas = body.horarios.map((h) => ({ ...h, barbero_id: params.id }))
      const { data, error: dbError } = await sb.from('horarios').insert(filas).select('*')

      if (dbError) return status(400, { error: dbError.message })
      return data
    },
    { body: esquemaHorarios, detail: { tags: ['Barberos'], summary: 'Reemplazar horarios semanales (admin)' } }
  )
