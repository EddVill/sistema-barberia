// Asistente de reserva en 4 pasos (HU-20 a HU-25, HU-28 + pagos HU-46)
// Servicio → Barbero → Fecha y hora → Pago (pasarela demo en soles)
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Check, Clock, CreditCard, Scissors, User } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { formatoPEN, hoyISO, cn } from '@/lib/utils'
import type { Barbero, Cita, Servicio } from '@/lib/tipos'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PagoForm } from '@/components/PagoForm'

const PASOS = ['Servicio', 'Barbero', 'Fecha y hora', 'Pago']

export default function Reservar() {
  const navigate = useNavigate()
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [barberos, setBarberos] = useState<Barbero[]>([])
  const [servicio, setServicio] = useState<Servicio | null>(null)
  const [barbero, setBarbero] = useState<Barbero | null>(null)
  const [fecha, setFecha] = useState(hoyISO())
  const [hora, setHora] = useState('')
  const [notas, setNotas] = useState('')
  const [slots, setSlots] = useState<string[]>([])
  const [mensajeSlots, setMensajeSlots] = useState('')
  const [cargandoSlots, setCargandoSlots] = useState(false)
  const [dialogo, setDialogo] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [citaCreada, setCitaCreada] = useState<Cita | null>(null)

  const paso = citaCreada ? 4 : !servicio ? 1 : !barbero ? 2 : 3

  useEffect(() => {
    api<Servicio[]>('/servicios').then(setServicios).catch(() => toast.error('No se pudieron cargar los servicios'))
    api<Barbero[]>('/barberos').then(setBarberos).catch(() => toast.error('No se pudieron cargar los barberos'))
  }, [])

  // Cada vez que cambian barbero o fecha se recalcula la disponibilidad (HU-22)
  const cargarSlots = useCallback(() => {
    if (!barbero) return
    setCargandoSlots(true)
    setHora('')
    api<{ slots: string[]; mensaje?: string }>(
      `/disponibilidad?barbero_id=${barbero.id}&fecha=${fecha}`
    )
      .then((r) => {
        setSlots(r.slots)
        setMensajeSlots(r.mensaje ?? '')
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setCargandoSlots(false))
  }, [barbero, fecha])

  useEffect(() => {
    cargarSlots()
  }, [cargarSlots])

  async function confirmar() {
    if (!servicio || !barbero || !hora) return
    setConfirmando(true)
    try {
      const cita = await api<Cita>('/citas', {
        method: 'POST',
        body: JSON.stringify({
          servicio_id: servicio.id,
          barbero_id: barbero.id,
          fecha,
          hora,
          notas: notas || undefined,
        }),
      })
      toast.success('Reserva creada — ahora elige cómo pagar')
      setCitaCreada(cita)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo reservar')
      cargarSlots() // refresca por si el slot quedó ocupado (HU-28)
    } finally {
      setConfirmando(false)
      setDialogo(false)
    }
  }

  // ───────── PASO 4: pago ─────────
  if (citaCreada) {
    return (
      <div className="mx-auto max-w-xl">
        <h1 className="font-display text-3xl tracking-wide">PASO 4 · PAGO</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tu reserva está creada. Completa el pago en soles para confirmarla al instante.
        </p>
        <Card className="mt-6">
          <CardContent className="p-6">
            <PagoForm
              cita={citaCreada}
              onExito={() => {/* PagoForm ya muestra el comprobante */}}
              onCancelar={() => navigate('/mis-citas')}
            />
            <Button variant="ghost" className="mt-2 w-full" onClick={() => navigate('/mis-citas')}>
              Ir a mis citas
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl tracking-wide">RESERVAR CITA</h1>

      {/* Indicador de pasos */}
      <div className="mt-4 flex items-center gap-2">
        {PASOS.map((t, i) => (
          <div key={t} className="flex flex-1 flex-col gap-1.5">
            <div className={cn('h-1.5 rounded-full', paso > i ? 'bg-primary' : 'bg-secondary')} />
            <span className={cn('text-xs', paso > i ? 'text-primary' : 'text-muted-foreground')}>
              {i + 1}. {t}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {/* Paso 1: servicio */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <Scissors className="size-4 text-primary" /> 1 · Elige un servicio
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {servicios.map((s) => (
                <Card
                  key={s.id}
                  onClick={() => setServicio(s)}
                  className={cn(
                    'cursor-pointer transition-colors hover:border-primary/50',
                    servicio?.id === s.id && 'border-primary ring-1 ring-primary'
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">{s.nombre}</h3>
                        {s.descripcion && <p className="mt-1 text-xs text-muted-foreground">{s.descripcion}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{formatoPEN(s.precio)}</p>
                        <p className="text-xs text-muted-foreground">{s.duracion_min} min</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Paso 2: barbero */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <User className="size-4 text-primary" /> 2 · Elige tu barbero
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {barberos.map((b) => (
                <Card
                  key={b.id}
                  onClick={() => setBarbero(b)}
                  className={cn(
                    'cursor-pointer transition-colors hover:border-primary/50',
                    barbero?.id === b.id && 'border-primary ring-1 ring-primary'
                  )}
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-display font-bold text-primary-foreground">
                      {b.nombre.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold">{b.nombre}</h3>
                      <p className="text-xs text-muted-foreground">{b.especialidad ?? 'Barbero profesional'}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Paso 3: fecha y hora */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <CalendarDays className="size-4 text-primary" /> 3 · Fecha y hora
            </h2>
            <Card>
              <CardContent className="space-y-4 p-4">
                <div className="max-w-56 space-y-2">
                  <Label htmlFor="fecha">Fecha</Label>
                  <Input
                    id="fecha"
                    type="date"
                    min={hoyISO()}
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Horas disponibles {barbero && `· ${barbero.nombre}`}</Label>
                  {!barbero ? (
                    <p className="text-sm text-muted-foreground">Primero selecciona un barbero.</p>
                  ) : cargandoSlots ? (
                    <p className="text-sm text-muted-foreground">Buscando horarios…</p>
                  ) : mensajeSlots || slots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{mensajeSlots || 'No hay horas disponibles para esta fecha.'}</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {slots.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setHora(s)}
                          className={cn(
                            'flex items-center gap-1 rounded-lg border border-input bg-card px-3 py-2 text-sm transition-colors hover:border-primary/60',
                            hora === s && 'border-primary bg-primary font-bold text-primary-foreground'
                          )}
                        >
                          <Clock className="size-3.5" /> {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notas">Notas para el barbero (opcional)</Label>
                  <Textarea
                    id="notas"
                    placeholder="Ej. con máquina 1 a los lados"
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Resumen lateral */}
        <aside>
          <Card className="sticky top-24">
            <CardContent className="space-y-3 p-5">
              <h3 className="font-display text-lg tracking-wide">RESUMEN</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Servicio</dt>
                  <dd className="font-medium">{servicio?.nombre ?? '—'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Barbero</dt>
                  <dd className="font-medium">{barbero?.nombre ?? '—'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Fecha</dt>
                  <dd className="font-medium">{fecha}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Hora</dt>
                  <dd className="font-medium">{hora || '—'}</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-2">
                  <dt className="text-muted-foreground">Total (PEN)</dt>
                  <dd className="font-bold text-primary">{servicio ? formatoPEN(servicio.precio) : '—'}</dd>
                </div>
              </dl>
              <Button
                className="w-full"
                disabled={!servicio || !barbero || !hora}
                onClick={() => setDialogo(true)}
              >
                <Check /> Confirmar y pagar
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Diálogo de confirmación */}
      <Dialog open={dialogo} onOpenChange={setDialogo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar reserva</DialogTitle>
            <DialogDescription>
              {servicio?.nombre} con {barbero?.nombre} — {fecha} a las {hora}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDialogo(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmar} disabled={confirmando}>
              {confirmando ? 'Reservando…' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
