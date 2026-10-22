// Indicadores para el panel de administración (épica E7)
import { Elysia } from 'elysia'
import { sb } from '../lib/supabase'
import { requiereAdmin } from '../lib/auth'
import { hoyLocal } from '../lib/fechas'

const RELACION =
  '*, cliente:usuarios(nombre), barbero:barberos(nombre), servicio:servicios(nombre, precio)'

export const dashboardRoutes = new Elysia({ name: 'dashboard', prefix: '/api' })
  .use(requiereAdmin)

  // GET /api/dashboard — KPIs del negocio (HU-37, HU-38, HU-39)
  .get(
    '/dashboard',
    async ({ status }) => {
      const hoy = hoyLocal()
      const inicioMes = `${hoy.slice(0, 7)}-01`

      // Las cuatro consultas se lanzan en paralelo
      const [citasHoy, pendientes, clientes, completadasMes, porEstado, proximas] =
        await Promise.all([
          sb.from('citas').select('*', { count: 'exact', head: true }).eq('fecha', hoy),
          sb.from('citas').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
          sb.from('usuarios').select('*', { count: 'exact', head: true }).eq('rol', 'cliente'),
          sb
            .from('citas')
            .select('servicio:servicios(precio)')
            .eq('estado', 'completada')
            .gte('fecha', inicioMes),
          sb.from('citas').select('estado'),
          sb
            .from('citas')
            .select(RELACION)
            .eq('fecha', hoy)
            .neq('estado', 'cancelada')
            .order('hora')
            .limit(10),
        ])

      if (citasHoy.error || pendientes.error || clientes.error || completadasMes.error || porEstado.error || proximas.error) {
        return status(500, { error: 'Error calculando los indicadores' })
      }

      // Ingresos del mes = suma de precios de citas completadas (HU-38)
      const ingresosMes = (completadasMes.data ?? []).reduce(
        (suma, c) => suma + Number((c.servicio as { precio: number } | null)?.precio ?? 0),
        0
      )

      // Distribución por estado
      const estados = { pendiente: 0, confirmada: 0, completada: 0, cancelada: 0 }
      for (const c of porEstado.data ?? []) {
        estados[c.estado as keyof typeof estados] = (estados[c.estado as keyof typeof estados] ?? 0) + 1
      }

      return {
        citas_hoy: citasHoy.count ?? 0,
        citas_pendientes: pendientes.count ?? 0,
        clientes_registrados: clientes.count ?? 0,
        ingresos_mes: ingresosMes,
        por_estado: estados,
        proximas_hoy: proximas.data ?? [],
      }
    },
    { detail: { tags: ['Dashboard'], summary: 'KPIs del negocio (admin)' } }
  )
