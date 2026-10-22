// Panel de administración: KPIs del negocio (HU-37, HU-38, HU-39)
import { useEffect, useState } from 'react'
import { CalendarDays, Clock, Users, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { formatoPEN } from '@/lib/utils'
import type { DashboardDatos, EstadoCita } from '@/lib/tipos'
import { Card, CardContent } from '@/components/ui/card'
import { EstadoBadge } from '@/components/EstadoBadge'

const ESTADOS: EstadoCita[] = ['pendiente', 'confirmada', 'completada', 'cancelada']

export default function Dashboard() {
  const [datos, setDatos] = useState<DashboardDatos | null>(null)

  useEffect(() => {
    api<DashboardDatos>('/dashboard')
      .then(setDatos)
      .catch((err) => toast.error(err.message))
  }, [])

  if (!datos) return <p className="text-muted-foreground">Cargando indicadores…</p>

  const totalCitas = Object.values(datos.por_estado).reduce((a, b) => a + b, 0)

  const kpis = [
    { icono: CalendarDays, valor: datos.citas_hoy, etiqueta: 'Citas hoy' },
    { icono: Clock, valor: datos.citas_pendientes, etiqueta: 'Pendientes' },
    { icono: Users, valor: datos.clientes_registrados, etiqueta: 'Clientes' },
    { icono: Wallet, valor: formatoPEN(datos.ingresos_mes), etiqueta: 'Ingresos del mes' },
  ]

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide">DASHBOARD</h1>
      <p className="mt-1 text-sm text-muted-foreground">Resumen de la operación de la barbería.</p>

      {/* KPIs */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.etiqueta}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <k.icono className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold">{k.valor}</p>
                <p className="text-xs text-muted-foreground">{k.etiqueta}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Distribución por estado */}
        <Card>
          <CardContent className="p-5">
            <h2 className="font-semibold">Citas por estado ({totalCitas} en total)</h2>
            <div className="mt-4 space-y-3">
              {ESTADOS.map((e) => {
                const n = datos.por_estado[e] ?? 0
                const pct = totalCitas ? Math.round((n / totalCitas) * 100) : 0
                return (
                  <div key={e}>
                    <div className="flex items-center justify-between text-sm">
                      <EstadoBadge estado={e} />
                      <span className="text-muted-foreground">{n} · {pct}%</span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Próximas citas de hoy */}
        <Card>
          <CardContent className="p-5">
            <h2 className="font-semibold">Próximas citas de hoy</h2>
            {datos.proximas_hoy.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No hay citas programadas para hoy.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {datos.proximas_hoy.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="font-semibold text-primary">{c.hora.slice(0, 5)}</span>
                    <span className="flex-1 truncate">{c.cliente?.nombre ?? 'Cliente'}</span>
                    <span className="hidden flex-1 truncate text-muted-foreground sm:block">
                      {c.servicio?.nombre}
                    </span>
                    <EstadoBadge estado={c.estado} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
