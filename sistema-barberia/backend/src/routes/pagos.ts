// Pasarela de pagos de reservas — montos en SOLES (PEN)
// Métodos: yape · plin · efectivo (pasarela simulada PagoSeguro PE)
// Incluye comprobantes COMP-XXXXXX y protección anti doble cobro.
import { Elysia, t } from 'elysia'
import { sb } from '../lib/supabase'
import { requiereAuth, requiereAdmin } from '../lib/auth'
import { procesarPago, siguienteComprobante, CODIGO_VALIDO } from '../lib/pasarela'

// El pago muestra la cita (con servicio y barbero) y el cliente (embeds PostgREST)
const RELACION =
  '*, cita:citas(fecha, hora, estado, servicio:servicios(nombre), barbero:barberos(nombre)), cliente:usuarios(nombre, email)'

export const pagosRoutes = new Elysia({ name: 'pagos', prefix: '/api' })
  .use(requiereAuth)

  // POST /api/pagos — cobra una cita pendiente (Yape, Plin o efectivo)
  .post(
    '/pagos',
    async ({ usuario, body, status }) => {
      // 1) La cita debe existir, ser propia y estar cobrable
      const { data: cita } = await sb
        .from('citas')
        .select('*, servicio:servicios(nombre, precio)')
        .eq('id', body.cita_id)
        .maybeSingle()

      if (!cita) return status(404, { error: 'Cita no encontrada' })
      if (usuario.rol !== 'admin' && cita.cliente_id !== usuario.sub) {
        return status(403, { error: 'Solo puedes pagar tus propias citas' })
      }
      if (cita.estado === 'cancelada') {
        return status(409, { error: 'No puedes pagar una cita cancelada' })
      }

      // 🛡️ PROTECCIÓN ANTI DOBLE COBRO (1): una cita pagada no se cobra otra vez
      if (cita.estado_pago === 'pagado') {
        return status(409, { error: 'Esta cita ya fue pagada (protección anti doble cobro)' })
      }

      // 2) El monto SIEMPRE lo fija el servidor según el precio del servicio (PEN)
      const monto = Number(cita.servicio?.precio ?? 0)
      if (monto <= 0) return status(400, { error: 'La cita no tiene un monto cobrable' })

      // 🛡️ PROTECCIÓN ANTI DOBLE COBRO (2): el código de operación Yape/Plin
      //     solo se acepta una vez en todo el sistema
      if (body.metodo !== 'efectivo') {
        if (!CODIGO_VALIDO(body.codigo)) {
          return status(400, { error: 'El código de operación debe tener 6 dígitos' })
        }
        const { data: duplicado } = await sb
          .from('pagos')
          .select('id')
          .eq('codigo_operacion', (body.codigo ?? '').trim())
          .eq('estado', 'aprobado')
          .maybeSingle()
        if (duplicado) {
          return status(409, {
            error: 'Ese código de operación ya fue registrado en otro pago (anti doble cobro)',
          })
        }
      }

      // 3) La pasarela valida el método y simula el cobro
      const resultado = procesarPago({
        metodo: body.metodo,
        monto,
        codigo: body.codigo,
        telefono: body.telefono,
      })

      // 4) Solo un pago aprobado emite comprobante (numeración secuencial)
      const comprobante = resultado.estado === 'aprobado' ? await siguienteComprobante() : null

      // 5) Se registra TODO intento de pago (aprobado, pendiente_caja o rechazado)
      const { data: pago, error: dbError } = await sb
        .from('pagos')
        .insert({
          cita_id: cita.id,
          cliente_id: cita.cliente_id,
          monto,
          moneda: 'PEN',
          metodo: body.metodo,
          estado: resultado.estado,
          marca: resultado.marca,
          referencia: resultado.referencia,
          codigo_operacion: body.metodo === 'efectivo' ? null : (body.codigo ?? '').trim() || null,
          telefono: body.telefono ?? null,
          comprobante,
          detalle: resultado.mensaje,
        })
        .select('*')
        .single()

      if (dbError) {
        // 🛡️ PROTECCIÓN ANTI DOBLE COBRO (3): los índices únicos de la base de
        //     datos rechazan duplicados incluso si dos solicitudes llegan a la vez
        if ((dbError as { code?: string }).code === '23505') {
          return status(409, { error: 'El pago ya fue registrado (protección anti doble cobro)' })
        }
        return status(500, { error: dbError.message })
      }

      if (resultado.estado === 'rechazado') {
        return status(402, { error: resultado.mensaje, referencia: resultado.referencia })
      }

      if (resultado.estado === 'aprobado') {
        // Pago en línea (Yape/Plin) → cita confirmada y pagada al instante
        await sb
          .from('citas')
          .update({ estado_pago: 'pagado', estado: 'confirmada' })
          .eq('id', cita.id)
        return {
          mensaje: resultado.mensaje,
          pago,
          comprobante,
          cita: { id: cita.id, estado_pago: 'pagado', estado: 'confirmada' },
        }
      }

      // Efectivo (pendiente_caja): la cita sigue pendiente hasta que la caja confirme
      return {
        mensaje: resultado.mensaje,
        pago,
        comprobante: null,
        cita: { id: cita.id, estado_pago: 'pendiente', estado: 'pendiente' },
      }
    },
    {
      body: t.Object({
        cita_id: t.String(),
        metodo: t.Union([t.Literal('yape'), t.Literal('plin'), t.Literal('efectivo')]),
        codigo: t.Optional(t.String()),
        telefono: t.Optional(t.String()),
      }),
      detail: { tags: ['Pagos'], summary: 'Pagar una cita: Yape, Plin o efectivo (PEN)' },
    }
  )

  // GET /api/pagos/mios — historial de pagos del usuario
  .get(
    '/pagos/mios',
    async ({ usuario, status }) => {
      const { data, error: dbError } = await sb
        .from('pagos')
        .select(RELACION)
        .eq('cliente_id', usuario.sub)
        .order('created_at', { ascending: false })

      if (dbError) return status(500, { error: dbError.message })
      return data
    },
    { detail: { tags: ['Pagos'], summary: 'Mis pagos (auth)' } }
  )

  // GET /api/pagos/cita/:cita_id — comprobante del pago aprobado de una cita
  .get(
    '/pagos/cita/:cita_id',
    async ({ usuario, params, status }) => {
      const { data: pago } = await sb
        .from('pagos')
        .select(RELACION)
        .eq('cita_id', params.cita_id)
        .eq('estado', 'aprobado')
        .maybeSingle()

      if (!pago) return status(404, { error: 'Esta cita no tiene un pago aprobado' })
      if (usuario.rol !== 'admin' && pago.cliente_id !== usuario.sub) {
        return status(403, { error: 'Solo puedes ver tus propios comprobantes' })
      }
      return pago
    },
    { detail: { tags: ['Pagos'], summary: 'Comprobante del pago de una cita (auth)' } }
  )

// GET /api/pagos + POST /api/pagos/:id/confirmar-efectivo — solo admin
export const pagosAdminRoutes = new Elysia({ name: 'pagos-admin', prefix: '/api' })
  .use(requiereAdmin)
  .get(
    '/pagos',
    async ({ status }) => {
      const { data, error: dbError } = await sb
        .from('pagos')
        .select(RELACION)
        .order('created_at', { ascending: false })

      if (dbError) return status(500, { error: dbError.message })
      return data
    },
    { detail: { tags: ['Pagos'], summary: 'Listar todos los pagos (admin)' } }
  )

  // POST /api/pagos/:id/confirmar-efectivo — la caja recibe el efectivo y
  // emite el comprobante (HU-54). Solo el rol administrador.
  .post(
    '/pagos/:id/confirmar-efectivo',
    async ({ params, status }) => {
      const { data: pago } = await sb.from('pagos').select('*').eq('id', params.id).maybeSingle()
      if (!pago) return status(404, { error: 'Pago no encontrado' })
      if (pago.metodo !== 'efectivo') {
        return status(409, { error: 'Solo los pagos en efectivo se confirman en caja' })
      }

      // 🛡️ PROTECCIÓN ANTI DOBLE COBRO: un pago confirmado no se vuelve a confirmar
      if (pago.estado === 'aprobado') {
        return status(409, { error: 'Este pago ya fue confirmado (anti doble cobro)' })
      }
      if (pago.estado !== 'pendiente_caja') {
        return status(409, { error: 'Este pago no está pendiente de caja' })
      }

      const comprobante = await siguienteComprobante()
      await sb
        .from('pagos')
        .update({ estado: 'aprobado', comprobante, detalle: 'Cobro en efectivo confirmado en caja' })
        .eq('id', pago.id)

      // La cita queda pagada y confirmada al recibir el cobro
      await sb
        .from('citas')
        .update({ estado_pago: 'pagado', estado: 'confirmada' })
        .eq('id', pago.cita_id)

      const { data: actualizado } = await sb
        .from('pagos')
        .select(RELACION)
        .eq('id', pago.id)
        .maybeSingle()

      return {
        mensaje: 'Cobro en efectivo confirmado. Comprobante emitido',
        pago: actualizado,
        comprobante,
      }
    },
    { detail: { tags: ['Pagos'], summary: 'Confirmar cobro en efectivo en caja (admin)' } }
  )
