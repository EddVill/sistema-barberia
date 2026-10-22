// Todas las citas del sistema con filtro y cambio de estado (HU-29…HU-31)
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { formatoPEN, formatoFechaCorta } from '@/lib/utils'
import type { Cita, EstadoCita } from '@/lib/tipos'
import { Select } from '@/components/ui/select'
import { EstadoBadge } from '@/components/EstadoBadge'

const ESTADOS: EstadoCita[] = ['pendiente', 'confirmada', 'completada', 'cancelada']

export default function AdminCitas() {
  const [citas, setCitas] = useState<Cita[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState<'todas' | EstadoCita>('todas')

  function cargar() {
    api<Cita[]>('/citas')
      .then(setCitas)
      .catch((err) => toast.error(err.message))
      .finally(() => setCargando(false))
  }

  useEffect(cargar, [])

  const visibles = useMemo(
    () => (filtro === 'todas' ? citas : citas.filter((c) => c.estado === filtro)),
    [citas, filtro]
  )

  async function cambiarEstado(cita: Cita, estado: EstadoCita) {
    try {
      await api(`/citas/${cita.id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) })
      toast.success('Estado actualizado')
      setCitas((prev) => prev.map((c) => (c.id === cita.id ? { ...c, estado } : c)))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar')
    }
  }

  if (cargando) return <p className="text-muted-foreground">Cargando citas…</p>

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-wide">CITAS</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {visibles.length} de {citas.length} citas
          </p>
        </div>
        <Select className="w-48" value={filtro} onChange={(e) => setFiltro(e.target.value as typeof filtro)}>
          <option value="todas">Todas las citas</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>
              {e.charAt(0).toUpperCase() + e.slice(1)}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-3">Fecha</th>
              <th className="p-3">Hora</th>
              <th className="p-3">Cliente</th>
              <th className="p-3">Barbero</th>
              <th className="p-3">Servicio</th>
              <th className="p-3">Precio</th>
              <th className="p-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3">{formatoFechaCorta(c.fecha)}</td>
                <td className="p-3 font-semibold text-primary">{c.hora.slice(0, 5)}</td>
                <td className="p-3">{c.cliente?.nombre ?? '—'}</td>
                <td className="p-3">{c.barbero?.nombre ?? '—'}</td>
                <td className="p-3">{c.servicio?.nombre ?? '—'}</td>
                <td className="p-3">{c.servicio?.precio != null ? formatoPEN(c.servicio.precio) : '—'}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <EstadoBadge estado={c.estado} />
                    <Select
                      className="h-8 w-32 text-xs"
                      value={c.estado}
                      onChange={(e) => cambiarEstado(c, e.target.value as EstadoCita)}
                    >
                      {ESTADOS.map((e) => (
                        <option key={e} value={e}>
                          {e.charAt(0).toUpperCase() + e.slice(1)}
                        </option>
                      ))}
                    </Select>
                  </div>
                </td>
              </tr>
            ))}
            {visibles.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">
                  No hay citas con ese filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
