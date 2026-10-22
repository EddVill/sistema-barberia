// Citas: disponibilidad, creación, listado por rol, cambio de estado y
// cancelación (épicas E4 y E5)
import { Elysia, t } from 'elysia'
import { sb } from '../lib/supabase'
import { requiereAuth } from '../lib/auth'
import { diaDeLaSemana, hoyLocal } from '../lib/fechas'

// Embed de datos relacionados en cada cita (sintaxis PostgREST).
// resenas(count) permite saber si la cita ya fue valorada.
const RELACION =
  '*, cliente:usuarios(nombre, email), barbero:barberos(nombre), servicio:servicios(nombre, precio), resenas(count)'

export const disponibilidadPublica = new Elysia({ name: 'disponibilidad', prefix: '/api' })
  // GET /api/disponibilidad?barbero_id=&fecha= — horas libres (HU-22)
  .get(
    '/disponibilidad',
    async ({ query, status }) => {
      const dia = diaDeLaSemana(query.fecha)

      // 1) Rangos configurados para ese barbero y día de la semana
      const { data: rangos, error: dbError } = await sb
        .from('horarios')
        .select('*')
        .eq('barbero_id', query.barbero_id)
        .eq('dia_semana', dia)
      if (dbError) return status(500, { error: dbError.message })
      if (!rangos?.length) return { fecha: query.fecha, slots: [], mensaje: 'El barbero no atiende este día' }

      // 2) Genera turnos de 30 minutos dentro de cada rango
      const slots: string[] = []
      for (const r of rangos) {
        const [h, m] = r.hora_inicio.split(':').map(Number)
        const [fh, fm] = r.hora_fin.split(':').map(Number)
        let hh = h
        let mm = m
        while (hh < fh || (hh === fh && mm < fm)) {
          slots.push(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`)
          mm += 30
          if (mm >= 60) { mm -= 60; hh += 1 }
        }
      }

      // 3) Quita las horas con cita activa y las pasadas si es hoy
      const { data: ocupadas } = await sb
        .from('citas')
        .select('hora')
        .eq('barbero_id', query.barbero_id)
        .eq('fecha', query.fecha)
        .neq('estado', 'cancelada')
      const ocupadasSet = new Set((ocupadas ?? []).map((c) => c.hora.slice(0, 5)))
      const libres = slots.filter((s) => !ocupadasSet.has(s))

      if (query.fecha === hoyLocal()) {
        const ahora = new Date()
        const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes()
        return {
          fecha: query.fecha,
          slots: libres.filter((s) => {
            const [h, m] = s.split(':').map(Number)
            return h * 60 + m > minutosAhora
          }),
        }
      }
      return { fecha: query.fecha, slots: libres }
    },
    {
      query: t.Object({
        barbero_id: t.String(),
        fecha: t.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' }),
      }),
      detail: { tags: ['Citas'], summary: 'Horas disponibles por barbero y fecha (público)' },
    }
  )

export const citasRoutes = new Elysia({ name: 'citas', prefix: '/api' })
  .use(requiereAuth)

  // GET /api/citas — cliente: propias · barbero: asignadas · admin: todas
  .get(
    '/citas',
    async ({ usuario, status }) => {
      let consulta = sb
        .from('citas')
        .select(RELACION)
        .order('fecha', { ascending: false })
        .order('hora')

      if (usuario.rol === 'cliente') consulta = consulta.eq('cliente_id', usuario.sub)
      if (usuario.rol === 'barbero') {
        const { data: barbero } = await sb
          .from('barberos')
          .select('id')
          .eq('usuario_id', usuario.sub)
          .maybeSingle()
        if (!barbero) return [] // cuenta de barbero sin ficha vinculada
        consulta = consulta.eq('barbero_id', barbero.id)
      }

      const { data, error: dbError } = await consulta
      if (dbError) return status(500, { error: dbError.message })
      return data
    },
    { detail: { tags: ['Citas'], summary: 'Listar citas según rol (auth)' } }
  )

  // POST /api/citas — crear reserva (HU-20 a HU-25)
  .post(
    '/citas',
    async ({ usuario, body, status }) => {
      // Validaciones de negocio en el servidor (HU-28)
      const { data: servicio } = await sb
        .from('servicios')
        .select('id, activo')
        .eq('id', body.servicio_id)
        .single()
      if (!servicio || !servicio.activo) return status(404, { error: 'Servicio no disponible' })

      const { data: barbero } = await sb
        .from('barberos')
        .select('id, activo')
        .eq('id', body.barbero_id)
        .single()
      if (!barbero || !barbero.activo) return status(404, { error: 'Barbero no disponible' })

      const { data: ocupada } = await sb
        .from('citas')
        .select('id')
        .eq('barbero_id', body.barbero_id)
        .eq('fecha', body.fecha)
        .eq('hora', body.hora)
        .neq('estado', 'cancelada')
        .maybeSingle()
      if (ocupada) return status(409, { error: 'Ese horario ya está reservado' })

      const { data, error: dbError } = await sb
        .from('citas')
        .insert({
          cliente_id: usuario.sub,
          barbero_id: body.barbero_id,
          servicio_id: body.servicio_id,
          fecha: body.fecha,
          hora: body.hora,
          notas: body.notas ?? null,
          estado: 'pendiente',
        })
        .select(RELACION)
        .single()

      if (dbError) return status(400, { error: dbError.message })
      return data
    },
    {
      body: t.Object({
        servicio_id: t.String(),
        barbero_id: t.String(),
        fecha: t.String({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' }),
        hora: t.String({ pattern: '^\\d{2}:\\d{2}$' }),
        notas: t.Optional(t.String()),
      }),
      detail: { tags: ['Citas'], summary: 'Crear reserva (auth)' },
    }
  )

  // PATCH /api/citas/:id/estado — admin o barbero dueño (HU-31, HU-33)
  .patch(
    '/citas/:id/estado',
    async ({ usuario, params, body, status }) => {
      const { data: cita } = await sb
        .from('citas')
        .select('id, barbero_id')
        .eq('id', params.id)
        .single()
      if (!cita) return status(404, { error: 'Cita no encontrada' })

      if (usuario.rol === 'barbero') {
        const { data: b } = await sb
          .from('barberos')
          .select('id')
          .eq('usuario_id', usuario.sub)
          .maybeSingle()
        if (!b || b.id !== cita.barbero_id) {
          return status(403, { error: 'Solo puedes gestionar tus propias citas' })
        }
      } else if (usuario.rol !== 'admin') {
        return status(403, { error: 'Solo admin o barbero pueden cambiar el estado' })
      }

      const { data, error: dbError } = await sb
        .from('citas')
        .update({ estado: body.estado })
        .eq('id', params.id)
        .select(RELACION)

      if (dbError) return status(400, { error: dbError.message })
      const actualizada = data?.[0]
      if (!actualizada) return status(404, { error: 'Cita no encontrada' })
      return actualizada
    },
    {
      body: t.Object({
        estado: t.Union([
          t.Literal('pendiente'),
          t.Literal('confirmada'),
          t.Literal('completada'),
          t.Literal('cancelada'),
        ]),
      }),
      detail: { tags: ['Citas'], summary: 'Cambiar estado de cita (admin/barbero)' },
    }
  )

  // DELETE /api/citas/:id — cancelación lógica: cliente dueño o admin (HU-27)
  .delete(
    '/citas/:id',
    async ({ usuario, params, status }) => {
      const { data: cita } = await sb
        .from('citas')
        .select('id, cliente_id')
        .eq('id', params.id)
        .single()
      if (!cita) return status(404, { error: 'Cita no encontrada' })
      if (usuario.rol !== 'admin' && cita.cliente_id !== usuario.sub) {
        return status(403, { error: 'No puedes cancelar citas de otro usuario' })
      }

      const { error: dbError } = await sb
        .from('citas')
        .update({ estado: 'cancelada' })
        .eq('id', params.id)

      if (dbError) return status(400, { error: dbError.message })
      return { mensaje: 'Cita cancelada correctamente' }
    },
    { detail: { tags: ['Citas'], summary: 'Cancelar cita (dueño o admin)' } }
  )
