// Formulario de la pasarela de pagos "PagoSeguro PE" (HU-46…HU-49).
// 3 métodos peruanos: yape · plin · efectivo. Montos en SOLES (PEN).
// Se usa en el paso 4 de Reservar y en el diálogo "Pagar ahora".
import { useState, type FormEvent } from 'react'
import { BadgeCheck, Banknote, Loader2, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { formatoPEN, cn } from '@/lib/utils'
import type { Cita, MetodoPago, Pago } from '@/lib/tipos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Números de cobro de la barbería (cámbialos por los tuyos)
const YAPE_NEGOCIO = '+51 987 654 321'
const PLIN_NEGOCIO = '+51 987 654 322'

const METODOS: { id: MetodoPago; nombre: string; icono: typeof Banknote; color: string }[] = [
  { id: 'yape', nombre: 'Yape', icono: Smartphone, color: '#5F259F' },
  { id: 'plin', nombre: 'Plin', icono: Smartphone, color: '#0088A9' },
  { id: 'efectivo', nombre: 'Efectivo', icono: Banknote, color: '#059669' },
]

interface Props {
  cita: Cita
  onExito: (pago: Pago) => void
  onCancelar?: () => void
}

export function PagoForm({ cita, onExito, onCancelar }: Props) {
  const [metodo, setMetodo] = useState<MetodoPago>('yape')
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState<Pago | null>(null)

  // yape / plin
  const [codigo, setCodigo] = useState('')
  const [telefono, setTelefono] = useState('+51 ')

  const monto = Number(cita.servicio?.precio ?? 0)

  async function pagar(e: FormEvent) {
    e.preventDefault()
    setCargando(true)
    try {
      const r = await api<{ mensaje: string; pago: Pago }>('/pagos', {
        method: 'POST',
        body: JSON.stringify({
          cita_id: cita.id,
          metodo,
          ...(metodo === 'yape' ? { codigo } : {}),
          ...(metodo === 'plin' ? { codigo, telefono } : {}),
        }),
      })
      setResultado(r.pago)
      if (r.pago.estado === 'aprobado') toast.success(r.mensaje)
      else toast.info(r.mensaje)
      onExito(r.pago)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'La pasarela no respondió')
    } finally {
      setCargando(false)
    }
  }

  // ── Pantalla final: comprobante (aprobado) o pendiente de caja ──
  if (resultado) {
    const aprobado = resultado.estado === 'aprobado'
    return (
      <div className="space-y-4 py-2">
        <div className="flex flex-col items-center gap-2 text-center">
          {aprobado ? (
            <BadgeCheck className="size-14 text-emerald-500" />
          ) : (
            <Banknote className="size-14 text-primary" />
          )}
          <h3 className="font-display text-xl tracking-wide">
            {aprobado ? 'PAGO CONFIRMADO' : 'PAGO PENDIENTE EN CAJA'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {formatoPEN(resultado.monto)} · {resultado.marca ?? resultado.metodo}
            {resultado.codigo_operacion && (
              <> · Op. <span className="font-mono">{resultado.codigo_operacion}</span></>
            )}
          </p>
          {aprobado && resultado.comprobante && (
            <p className="rounded-lg bg-secondary px-4 py-2 font-mono text-sm font-bold text-primary">
              Comprobante: {resultado.comprobante}
            </p>
          )}
          {!aprobado && (
            <p className="max-w-sm rounded-lg bg-secondary/60 px-4 py-2 text-xs text-muted-foreground">
              Acude a la caja de la barbería antes de tu cita. El administrador confirmará el
              cobro y ahí se emitirá tu comprobante de pago.
            </p>
          )}
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BadgeCheck className="size-3.5 text-emerald-500" />
            Protección anti doble cobro activa
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={pagar} className="space-y-4">
      {/* Resumen a cobrar */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">{cita.servicio?.nombre ?? 'Servicio'}</p>
          <p className="text-xs text-muted-foreground">
            {cita.fecha} · {cita.hora.slice(0, 5)}
          </p>
        </div>
        <p className="font-display text-xl font-bold text-primary">{formatoPEN(monto)}</p>
      </div>

      {/* Selector de método */}
      <div className="grid grid-cols-3 gap-2">
        {METODOS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMetodo(m.id)}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-xl border border-input bg-card px-2 py-3 text-xs font-medium transition-colors hover:border-primary/60',
              metodo === m.id && 'border-primary bg-primary/10 text-primary'
            )}
          >
            <m.icono className="size-5" style={metodo === m.id ? { color: m.color } : undefined} />
            {m.nombre}
          </button>
        ))}
      </div>

      {/* Yape: número de la barbería + código de operación */}
      {metodo === 'yape' && (
        <div className="space-y-3">
          <div className="rounded-xl border border-[#5F259F]/30 bg-[#5F259F]/5 px-4 py-3 text-sm">
            <p className="font-semibold text-[#5F259F]">Paga con Yape al número</p>
            <p className="font-mono text-lg font-bold">{YAPE_NEGOCIO}</p>
            <p className="text-xs text-muted-foreground">
              Titular: Barbería Élite E.I.R.L. · Monto exacto: {formatoPEN(monto)}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="codigo-yape">Código de operación Yape</Label>
            <Input
              id="codigo-yape"
              inputMode="numeric"
              placeholder="123456"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
            <p className="text-xs text-muted-foreground">
              Los 6 dígitos que muestra la app Yape al terminar el pago.
            </p>
          </div>
        </div>
      )}

      {/* Plin: celular +51 y código de operación */}
      {metodo === 'plin' && (
        <div className="space-y-3">
          <div className="rounded-xl border border-[#0088A9]/30 bg-[#0088A9]/5 px-4 py-3 text-sm">
            <p className="font-semibold text-[#0088A9]">Paga con Plin al número</p>
            <p className="font-mono text-lg font-bold">{PLIN_NEGOCIO}</p>
            <p className="text-xs text-muted-foreground">Titular: Barbería Élite E.I.R.L.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="telefono-plin">Celular registrado en Plin</Label>
            <Input
              id="telefono-plin"
              placeholder="+51 987 654 321"
              value={telefono}
              onChange={(e) => {
                const d = e.target.value.replace(/\D/g, '').replace(/^51/, '').slice(0, 9)
                setTelefono(`+51 ${d}`)
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="codigo-plin">Código de operación Plin</Label>
            <Input
              id="codigo-plin"
              inputMode="numeric"
              placeholder="123456"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
            <p className="text-xs text-muted-foreground">
              Celular peruano (+51 y 9 dígitos) y los 6 dígitos del comprobante de la app.
            </p>
          </div>
        </div>
      )}

      {/* Efectivo: se paga en caja */}
      {metodo === 'efectivo' && (
        <p className="rounded-xl border border-emerald-600/30 bg-emerald-600/5 px-4 py-3 text-sm text-muted-foreground">
          Reserva ahora y paga en efectivo en la caja de la barbería antes de tu cita. La reserva
          queda <span className="font-semibold text-foreground">pendiente de pago en caja</span> y el
          comprobante se emite cuando el administrador recibe el cobro.
        </p>
      )}

      <div className="flex gap-2 pt-1">
        {onCancelar && (
          <Button type="button" variant="secondary" className="flex-1" onClick={onCancelar} disabled={cargando}>
            Pagar después
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={cargando}>
          {cargando ? <Loader2 className="animate-spin" /> : metodo === 'efectivo' ? <Banknote /> : <Smartphone />}
          {cargando ? 'Procesando…' : metodo === 'efectivo' ? 'Reservar y pagar en caja' : `Pagar ${formatoPEN(monto)}`}
        </Button>
      </div>
      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
        Transacción protegida · anti doble cobro · PagoSeguro PE · Moneda: soles (PEN)
      </p>
    </form>
  )
}
