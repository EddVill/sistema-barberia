// Agenda del barbero: citas asignadas agrupadas por día (HU-32, HU-33)
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { formatoFecha } from '@/lib/utils'
import type { Cita, EstadoCita } from '@/lib/tipos'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EstadoBadge } from '@/components/EstadoBadge'

export default function CitasBarbero() {
  const [citas, setCitas] = useState<Cita[]>([])
  const [cargando, setCargando] = useState(true)

  function cargar() {
    api<Cita[]>('/citas')
      .then(setCitas)
      .catch((err) => toast.error(err.message))
      .finally(() => setCargando(false))
  }

  useEffect(cargar, [])

  async function cambiarEstado(cita: Cita, estado: EstadoCita) {
    if (estado === 'cancelada' && !window.confirm('¿Cancelar esta cita?')) return
    try {
      await api(`/citas/${cita.id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado }),
      })
      toast.success(`Cita marcada como "${estado}"`)
      cargar()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar')
    }
  }

  if (cargando) return <p className="text-muted-foreground">Cargando agenda…</p>

  // Agrupar por fecha manteniendo el orden de la API (más recientes primero)
  const porFecha = new Map<string, Cita[]>()
  for (const c of citas) {
    const lista = porFecha.get(c.fecha) ?? []
    lista.push(c)
    porFecha.set(c.fecha, lista)
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl tracking-wide">MI AGENDA</h1>
      <p className="mt-1 text-sm text-muted-foreground">Confirma o completa tus citas del día.</p>

      {citas.length === 0 && (
        <p className="mt-6 text-muted-foreground">No tienes citas asignadas por ahora.</p>
      )}

      <div className="mt-6 space-y-8">
        {[...porFecha.entries()].map(([fecha, lista]) => (
          <section key={fecha}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
              {formatoFecha(fecha)}
            </h2>
            <div className="space-y-3">
              {lista.map((c) => (
                <Card key={c.id} className="levita">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">
                          {c.hora.slice(0, 5)} · {c.cliente?.nombre ?? 'Cliente'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {c.servicio?.nombre ?? 'Servicio'}
                          {c.notas ? ` · Notas: ${c.notas}` : ''}
                        </p>
                      </div>
                      <EstadoBadge estado={c.estado} />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {c.estado === 'pendiente' && (
                        <Button size="sm" onClick={() => cambiarEstado(c, 'confirmada')}>
                          Confirmar
                        </Button>
                      )}
                      {c.estado === 'confirmada' && (
                        <Button size="sm" onClick={() => cambiarEstado(c, 'completada')}>
                          Completar
                        </Button>
                      )}
                      {(c.estado === 'pendiente' || c.estado === 'confirmada') && (
                        <Button size="sm" variant="destructive" onClick={() => cambiarEstado(c, 'cancelada')}>
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
