// Reseñas de citas completadas (épica E6)
import { Elysia, t } from 'elysia'
import { sb } from '../lib/supabase'
import { requiereAuth } from '../lib/auth'

export const resenasPublicas = new Elysia({ name: 'resenas-publicas', prefix: '/api' })
  // GET /api/resenas?barbero_id= — últimas reseñas (público, HU-35)
  .get(
    '/resenas',
    async ({ query, status }) => {
      let consulta = sb
        .from('resenas')
        .select('*, cliente:usuarios(nombre), barbero:barberos(nombre)')
        .order('created_at', { ascending: false })
        .limit(20)
      if (query.barbero_id) consulta = consulta.eq('barbero_id', query.barbero_id)

      const { data, error: dbError } = await consulta
      if (dbError) return status(500, { error: dbError.message })
      return data
    },
    {
      query: t.Object({ barbero_id: t.Optional(t.String()) }),
      detail: { tags: ['Reseñas'], summary: 'Listar reseñas (público)' },
    }
  )

export const resenasRoutes = new Elysia({ name: 'resenas', prefix: '/api' })
  .use(requiereAuth)

  // POST /api/resenas — valorar una cita completada propia (HU-34)
  .post(
    '/resenas',
    async ({ usuario, body, status }) => {
      const { data: cita } = await sb
        .from('citas')
        .select('id, cliente_id, barbero_id, estado')
        .eq('id', body.cita_id)
        .single()
      if (!cita || cita.cliente_id !== usuario.sub) {
        return status(404, { error: 'Cita no encontrada' })
      }
      if (cita.estado !== 'completada') {
        return status(400, { error: 'Solo puedes valorar citas completadas' })
      }

      const { data: yaExiste } = await sb
        .from('resenas')
        .select('id')
        .eq('cita_id', cita.id)
        .maybeSingle()
      if (yaExiste) return status(409, { error: 'Esta cita ya fue valorada' })

      const { data, error: dbError } = await sb
        .from('resenas')
        .insert({
          cita_id: cita.id,
          cliente_id: usuario.sub,
          barbero_id: cita.barbero_id,
          calificacion: body.calificacion,
          comentario: body.comentario ?? null,
        })
        .select('*')
        .single()

      if (dbError) return status(400, { error: dbError.message })
      return data
    },
    {
      body: t.Object({
        cita_id: t.String(),
        calificacion: t.Integer({ minimum: 1, maximum: 5 }),
        comentario: t.Optional(t.String()),
      }),
      detail: { tags: ['Reseñas'], summary: 'Crear reseña de cita completada (auth)' },
    }
  )
