// CRUD de servicios para el administrador (HU-11, HU-12, HU-13)
import { useEffect, useState, type FormEvent } from 'react'
import { Pencil, Plus, Power, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { formatoPEN } from '@/lib/utils'
import type { Servicio } from '@/lib/tipos'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

const vacio = { nombre: '', descripcion: '', precio: '', duracion_min: '30' }

export default function AdminServicios() {
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [cargando, setCargando] = useState(true)
  const [abierto, setAbierto] = useState(false)
  const [editando, setEditando] = useState<Servicio | null>(null)
  const [form, setForm] = useState(vacio)
  const [guardando, setGuardando] = useState(false)

  function cargar() {
    api<Servicio[]>('/servicios/admin')
      .then(setServicios)
      .catch((err) => toast.error(err.message))
      .finally(() => setCargando(false))
  }

  useEffect(cargar, [])

  function abrirNuevo() {
    setEditando(null)
    setForm(vacio)
    setAbierto(true)
  }

  function abrirEdicion(s: Servicio) {
    setEditando(s)
    setForm({
      nombre: s.nombre,
      descripcion: s.descripcion ?? '',
      precio: String(s.precio),
      duracion_min: String(s.duracion_min),
    })
    setAbierto(true)
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    setGuardando(true)
    const cuerpo = {
      nombre: form.nombre,
      descripcion: form.descripcion || undefined,
      precio: Number(form.precio),
      duracion_min: Number(form.duracion_min),
    }
    try {
      if (editando) {
        await api(`/servicios/${editando.id}`, { method: 'PUT', body: JSON.stringify(cuerpo) })
        toast.success('Servicio actualizado')
      } else {
        await api('/servicios', { method: 'POST', body: JSON.stringify(cuerpo) })
        toast.success('Servicio creado')
      }
      setAbierto(false)
      cargar()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setGuardando(false)
    }
  }

  async function alternar(s: Servicio) {
    try {
      await api(`/servicios/${s.id}`, {
        method: 'PUT',
        body: JSON.stringify({ activo: !s.activo }),
      })
      toast.success(s.activo ? 'Servicio desactivado' : 'Servicio activado')
      cargar()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo cambiar')
    }
  }

  async function eliminar(s: Servicio) {
    if (!window.confirm(`¿Eliminar el servicio "${s.nombre}"? (borrado lógico)`)) return
    try {
      await api(`/servicios/${s.id}`, { method: 'DELETE' })
      toast.success('Servicio eliminado')
      cargar()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo eliminar')
    }
  }

  if (cargando) return <p className="text-muted-foreground">Cargando servicios…</p>

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-wide">SERVICIOS</h1>
          <p className="mt-1 text-sm text-muted-foreground">Catálogo ofrecido por la barbería.</p>
        </div>
        <Button onClick={abrirNuevo}>
          <Plus /> Nuevo servicio
        </Button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">Precio</th>
              <th className="p-3">Duración</th>
              <th className="p-3">Estado</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {servicios.map((s) => (
              <tr key={s.id} className="border-t border-border transition-colors hover:bg-secondary/30">
                <td className="p-3">
                  <p className="font-medium">{s.nombre}</p>
                  {s.descripcion && <p className="text-xs text-muted-foreground">{s.descripcion}</p>}
                </td>
                <td className="p-3 font-semibold text-primary">{formatoPEN(s.precio)}</td>
                <td className="p-3">{s.duracion_min} min</td>
                <td className="p-3">
                  <Badge variant={s.activo ? 'success' : 'destructive'}>{s.activo ? 'Activo' : 'Inactivo'}</Badge>
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => abrirEdicion(s)} title="Editar" className="hover:bg-primary/15 hover:text-primary">
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => alternar(s)} title={s.activo ? 'Desactivar' : 'Activar'} className="hover:bg-primary/15 hover:text-primary">
                      <Power className={s.activo ? 'size-4' : 'size-4 text-emerald-400'} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => eliminar(s)} title="Eliminar" className="hover:bg-destructive/15 hover:text-destructive">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {servicios.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  No hay servicios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Diálogo crear/editar */}
      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar servicio' : 'Nuevo servicio'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={guardar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea id="descripcion" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="precio">Precio</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">S/</span>
                  <Input id="precio" type="number" min={0} step="0.5" className="pl-9" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duracion">Duración (min)</Label>
                <Input id="duracion" type="number" min={5} step={5} value={form.duracion_min} onChange={(e) => setForm({ ...form, duracion_min: e.target.value })} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setAbierto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
