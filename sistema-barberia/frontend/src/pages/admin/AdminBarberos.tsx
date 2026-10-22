// CRUD de barberos + editor de horarios semanales (HU-16 a HU-19)
import { useEffect, useState, type FormEvent } from 'react'
import { Clock, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { DIAS_SEMANA, opcionesHora } from '@/lib/utils'
import type { Barbero } from '@/lib/tipos'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface Rango { on: boolean; inicio: string; fin: string }
interface DiaHorario { manana: Rango; tarde: Rango }

const HORAS = opcionesHora()
const rangoVacio = (inicio = '09:00', fin = '13:00'): Rango => ({ on: false, inicio, fin })

function horariosVacios(): DiaHorario[] {
  return Array.from({ length: 7 }, () => ({ manana: rangoVacio(), tarde: rangoVacio('14:00', '19:00') }))
}

function desdeBarbero(b: Barbero): DiaHorario[] {
  const dias = horariosVacios()
  for (const h of b.horarios ?? []) {
    const rango = h.hora_inicio < '13:00' ? 'manana' : 'tarde'
    dias[h.dia_semana][rango] = { on: true, inicio: h.hora_inicio.slice(0, 5), fin: h.hora_fin.slice(0, 5) }
  }
  return dias
}

export default function AdminBarberos() {
  const [barberos, setBarberos] = useState<Barbero[]>([])
  const [cargando, setCargando] = useState(true)
  const [dialogo, setDialogo] = useState(false)
  const [editando, setEditando] = useState<Barbero | null>(null)
  const [nombre, setNombre] = useState('')
  const [especialidad, setEspecialidad] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Editor de horarios
  const [barberoHorario, setBarberoHorario] = useState<Barbero | null>(null)
  const [dias, setDias] = useState<DiaHorario[]>(horariosVacios())

  function cargar() {
    api<Barbero[]>('/barberos/admin')
      .then(setBarberos)
      .catch((err) => toast.error(err.message))
      .finally(() => setCargando(false))
  }

  useEffect(cargar, [])

  function abrirNuevo() {
    setEditando(null)
    setNombre('')
    setEspecialidad('')
    setDialogo(true)
  }

  function abrirEdicion(b: Barbero) {
    setEditando(b)
    setNombre(b.nombre)
    setEspecialidad(b.especialidad ?? '')
    setDialogo(true)
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    setGuardando(true)
    try {
      if (editando) {
        await api(`/barberos/${editando.id}`, {
          method: 'PUT',
          body: JSON.stringify({ nombre, especialidad: especialidad || undefined }),
        })
        toast.success('Barbero actualizado')
      } else {
        await api('/barberos', {
          method: 'POST',
          body: JSON.stringify({ nombre, especialidad: especialidad || undefined }),
        })
        toast.success('Barbero creado')
      }
      setDialogo(false)
      cargar()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar(b: Barbero) {
    if (!window.confirm(`¿Desactivar al barbero "${b.nombre}"?`)) return
    try {
      await api(`/barberos/${b.id}`, { method: 'DELETE' })
      toast.success('Barbero desactivado')
      cargar()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo desactivar')
    }
  }

  function abrirHorarios(b: Barbero) {
    setBarberoHorario(b)
    setDias(desdeBarbero(b))
  }

  async function guardarHorarios() {
    if (!barberoHorario) return
    const horarios = dias.flatMap((d, dia) => {
      const filas = []
      if (d.manana.on) filas.push({ dia_semana: dia, hora_inicio: d.manana.inicio, hora_fin: d.manana.fin })
      if (d.tarde.on) filas.push({ dia_semana: dia, hora_inicio: d.tarde.inicio, hora_fin: d.tarde.fin })
      return filas
    })
    try {
      await api(`/barberos/${barberoHorario.id}/horarios`, {
        method: 'PUT',
        body: JSON.stringify({ horarios }),
      })
      toast.success('Horarios actualizados')
      setBarberoHorario(null)
      cargar()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudieron guardar los horarios')
    }
  }

  if (cargando) return <p className="text-muted-foreground">Cargando barberos…</p>

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-wide">BARBEROS</h1>
          <p className="mt-1 text-sm text-muted-foreground">Equipo y horarios de atención.</p>
        </div>
        <Button onClick={abrirNuevo}>
          <Plus /> Nuevo barbero
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {barberos.map((b) => (
          <Card key={b.id} className={cn('levita', !b.activo && 'opacity-60')}>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-full bg-primary font-display font-bold text-primary-foreground">
                    {b.nombre.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold">{b.nombre}</h3>
                    <p className="text-xs text-muted-foreground">{b.especialidad ?? 'Barbero profesional'}</p>
                  </div>
                </div>
                <Badge variant={b.activo ? 'success' : 'destructive'}>{b.activo ? 'Activo' : 'Inactivo'}</Badge>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="secondary" onClick={() => abrirHorarios(b)}>
                  <Clock /> Horarios
                </Button>
                <Button size="sm" variant="ghost" onClick={() => abrirEdicion(b)}>
                  <Pencil /> Editar
                </Button>
                {b.activo && (
                  <Button size="sm" variant="ghost" onClick={() => eliminar(b)}>
                    <Trash2 className="text-destructive" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {barberos.length === 0 && (
          <p className="text-muted-foreground">No hay barberos registrados.</p>
        )}
      </div>

      {/* Diálogo crear/editar barbero */}
      <Dialog open={dialogo} onOpenChange={setDialogo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar barbero' : 'Nuevo barbero'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={guardar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="especialidad">Especialidad</Label>
              <Input id="especialidad" placeholder="Ej. Corte clásico y degradados" value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setDialogo(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de horarios semanales */}
      <Dialog open={!!barberoHorario} onOpenChange={(v) => !v && setBarberoHorario(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Horarios de {barberoHorario?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
            {dias.map((d, i) => (
              <div key={i} className="rounded-lg border border-border p-3">
                <p className="mb-2 text-sm font-medium">{DIAS_SEMANA[i]}</p>
                {(['manana', 'tarde'] as const).map((bloque) => (
                  <div key={bloque} className="mb-2 flex flex-wrap items-center gap-2 text-sm last:mb-0">
                    <label className="flex w-32 items-center gap-2">
                      <input
                        type="checkbox"
                        checked={d[bloque].on}
                        onChange={(e) =>
                          setDias(dias.map((x, j) => (j === i ? { ...x, [bloque]: { ...x[bloque], on: e.target.checked } } : x)))
                        }
                      />
                      {bloque === 'manana' ? 'Mañana' : 'Tarde'}
                    </label>
                    <Select
                      className="w-28"
                      disabled={!d[bloque].on}
                      value={d[bloque].inicio}
                      onChange={(e) =>
                        setDias(dias.map((x, j) => (j === i ? { ...x, [bloque]: { ...x[bloque], inicio: e.target.value } } : x)))
                      }
                    >
                      {HORAS.map((h) => <option key={h} value={h}>{h}</option>)}
                    </Select>
                    <span className="text-muted-foreground">→</span>
                    <Select
                      className="w-28"
                      disabled={!d[bloque].on}
                      value={d[bloque].fin}
                      onChange={(e) =>
                        setDias(dias.map((x, j) => (j === i ? { ...x, [bloque]: { ...x[bloque], fin: e.target.value } } : x)))
                      }
                    >
                      {HORAS.map((h) => <option key={h} value={h}>{h}</option>)}
                    </Select>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setBarberoHorario(null)}>
              Cancelar
            </Button>
            <Button onClick={guardarHorarios}>Guardar horarios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
