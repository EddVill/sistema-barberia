// Citas del cliente: listar, cancelar, pagar, ver comprobante y valorar (HU-26, HU-27, HU-34, HU-46…HU-52)
import { useEffect, useState } from 'react'
import { CreditCard, Receipt, Scissors, Star } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { formatoPEN, formatoFecha } from '@/lib/utils'
import type { Cita, Pago } from '@/lib/tipos'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EstadoBadge, EstadoPagoBadge } from '@/components/EstadoBadge'
import { PagoForm } from '@/components/PagoForm'
import { Comprobante } from '@/components/Comprobante'
import { cn } from '@/lib/utils'

export default function MisCitas() {
  const [citas, setCitas] = useState<Cita[]>([])
  const [cargando, setCargando] = useState(true)
  const [citaResena, setCitaResena] = useState<Cita | null>(null)
  const [citaPago, setCitaPago] = useState<Cita | null>(null)
  const [pagoVer, setPagoVer] = useState<Pago | null>(null)
  const [calificacion, setCalificacion] = useState(5)
  const [comentario, setComentario] = useState('')

  function cargar() {
    api<Cita[]>('/citas')
      .then(setCitas)
      .catch((err) => toast.error(err.message))
      .finally(() => setCargando(false))
  }

  useEffect(cargar, [])

  async function cancelar(cita: Cita) {
    if (!window.confirm(`¿Cancelar la cita del ${formatoFecha(cita.fecha)} a las ${cita.hora}?`)) return
    try {
      await api(`/citas/${cita.id}`, { method: 'DELETE' })
      toast.success('Cita cancelada')
      cargar()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo cancelar')
    }
  }

  async function verComprobante(cita: Cita) {
    try {
      const pago = await api<Pago>(`/pagos/cita/${cita.id}`)
      setPagoVer(pago)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo cargar el comprobante')
    }
  }

  async function enviarResena() {
    if (!citaResena) return
    try {
      await api('/resenas', {
        method: 'POST',
        body: JSON.stringify({ cita_id: citaResena.id, calificacion, comentario: comentario || undefined }),
      })
      toast.success('¡Gracias por tu reseña!')
      setCitaResena(null)
      setComentario('')
      setCalificacion(5)
      cargar()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo enviar la reseña')
    }
  }

  if (cargando) return <p className="text-muted-foreground">Cargando citas…</p>

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl tracking-wide">MIS CITAS</h1>
      <p className="mt-1 text-sm text-muted-foreground">Gestiona tus reservas y comparte tu experiencia.</p>

      <div className="mt-6 space-y-3">
        {citas.length === 0 && (
          <p className="text-muted-foreground">Aún no tienes citas. ¡Reserva tu primera desde el menú!</p>
        )}

        {citas.map((c) => (
          <Card key={c.id}>
            <CardContent className="space-y-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{c.servicio?.nombre ?? 'Servicio'}</h3>
                  <p className="text-sm text-muted-foreground">
                    <Scissors className="mr-1 inline size-3.5" />
                    {c.barbero?.nombre ?? 'Barbero'} · {formatoFecha(c.fecha)} · {c.hora.slice(0, 5)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <EstadoBadge estado={c.estado} />
                  <EstadoPagoBadge estado={c.estado_pago} />
                </div>
              </div>

              {c.notas && <p className="text-sm text-muted-foreground">Notas: {c.notas}</p>}
              {c.servicio?.precio != null && (
                <p className="text-sm font-medium text-primary">{formatoPEN(c.servicio.precio)}</p>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                {c.estado_pago === 'pendiente' && (c.estado === 'pendiente' || c.estado === 'confirmada') && (
                  <Button size="sm" onClick={() => setCitaPago(c)}>
                    <CreditCard /> Pagar ahora
                  </Button>
                )}
                {c.estado_pago === 'pagado' && (
                  <Button variant="secondary" size="sm" onClick={() => verComprobante(c)}>
                    <Receipt /> Ver comprobante
                  </Button>
                )}
                {(c.estado === 'pendiente' || c.estado === 'confirmada') && (
                  <Button variant="destructive" size="sm" onClick={() => cancelar(c)}>
                    Cancelar cita
                  </Button>
                )}
                {c.estado === 'completada' && (c.resenas?.[0]?.count ?? 0) === 0 && (
                  <Button size="sm" onClick={() => setCitaResena(c)}>
                    <Star /> Valorar servicio
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Diálogo de pago (pasarela demo, soles) */}
      <Dialog open={!!citaPago} onOpenChange={(v) => !v && setCitaPago(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagar cita</DialogTitle>
            <DialogDescription>
              {citaPago?.servicio?.nombre} con {citaPago?.barbero?.nombre}
            </DialogDescription>
          </DialogHeader>
          {citaPago && (
            <PagoForm
              cita={citaPago}
              onExito={() => {
                setCitaPago(null)
                cargar()
              }}
              onCancelar={() => setCitaPago(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo del comprobante de pago (HU-51) */}
      <Dialog open={!!pagoVer} onOpenChange={(v) => !v && setPagoVer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Comprobante de pago</DialogTitle>
            <DialogDescription>
              {pagoVer?.cita?.servicio?.nombre} · {pagoVer && formatoPEN(pagoVer.monto)}
            </DialogDescription>
          </DialogHeader>
          {pagoVer && <Comprobante pago={pagoVer} />}
        </DialogContent>
      </Dialog>

      {/* Diálogo de reseña */}
      <Dialog open={!!citaResena} onOpenChange={(v) => !v && setCitaResena(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Valorar servicio</DialogTitle>
            <DialogDescription>
              {citaResena?.servicio?.nombre} con {citaResena?.barbero?.nombre}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCalificacion(n)}
                  className="cursor-pointer rounded p-1"
                  aria-label={`${n} estrellas`}
                >
                  <Star
                    className={cn(
                      'size-8 transition-colors',
                      n <= calificacion ? 'fill-primary text-primary' : 'text-muted-foreground'
                    )}
                  />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Cuéntanos tu experiencia (opcional)"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setCitaResena(null)}>
              Cerrar
            </Button>
            <Button onClick={enviarResena}>Enviar reseña</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
