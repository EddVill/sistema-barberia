// Pagos del negocio: comprobantes, confirmación de efectivo en caja y
// total recaudado (HU-53, HU-54 y HU-55, admin)
import { useEffect, useState } from 'react'
import { Wallet, ClipboardCheck, Loader2, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { formatoPEN, formatoFechaCorta } from '@/lib/utils'
import type { Pago } from '@/lib/tipos'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Comprobante } from '@/components/Comprobante'

const ETIQUETA_METODO: Record<Pago['metodo'], string> = {
  yape: 'Yape',
  plin: 'Plin',
  efectivo: 'Efectivo',
}

const ESTADO_PAGO: Record<Pago['estado'], { texto: string; variante: 'success' | 'warning' | 'destructive' }> = {
  aprobado: { texto: 'Aprobado', variante: 'success' },
  pendiente_caja: { texto: 'Pendiente en caja', variante: 'warning' },
  rechazado: { texto: 'Rechazado', variante: 'destructive' },
}

export default function PagosAdmin() {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [cargando, setCargando] = useState(true)
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null)
  const [pagoVer, setPagoVer] = useState<Pago | null>(null)

  function cargar() {
    api<Pago[]>('/pagos')
      .then(setPagos)
      .catch((err) => toast.error(err.message))
      .finally(() => setCargando(false))
  }

  useEffect(cargar, [])

  // La caja recibe el efectivo → comprobante emitido (HU-54)
  async function confirmarCaja(pago: Pago) {
    if (!window.confirm(`¿Confirmar el cobro en efectivo de ${formatoPEN(Number(pago.monto))}?`)) return
    setConfirmandoId(pago.id)
    try {
      const r = await api<{ mensaje: string; comprobante: string }>(
        `/pagos/${pago.id}/confirmar-efectivo`,
        { method: 'POST' }
      )
      toast.success(`${r.mensaje} (${r.comprobante})`)
      cargar()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo confirmar el cobro')
    } finally {
      setConfirmandoId(null)
    }
  }

  const aprobados = pagos.filter((p) => p.estado === 'aprobado')
  const pendientesCaja = pagos.filter((p) => p.estado === 'pendiente_caja')
  const total = aprobados.reduce((s, p) => s + Number(p.monto), 0)

  if (cargando) return <p className="text-muted-foreground">Cargando pagos…</p>

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-wide">PAGOS</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pasarela Yape · Plin · efectivo · moneda: soles (PEN)
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {pendientesCaja.length > 0 && (
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-amber-700/10">
                  <ClipboardCheck className="size-5 text-amber-700" />
                </div>
                <div>
                  <p className="font-display text-xl font-bold text-amber-700">{pendientesCaja.length}</p>
                  <p className="text-xs text-muted-foreground">efectivos pendientes en caja</p>
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Wallet className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-display text-xl font-bold text-primary">{formatoPEN(total)}</p>
                <p className="text-xs text-muted-foreground">{aprobados.length} pagos aprobados</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-3">Fecha</th>
              <th className="p-3">Cliente</th>
              <th className="p-3">Servicio</th>
              <th className="p-3">Método</th>
              <th className="p-3">Comprobante</th>
              <th className="p-3">Referencia</th>
              <th className="p-3">Estado</th>
              <th className="p-3 text-right">Monto</th>
              <th className="p-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {pagos.map((p) => (
              <tr key={p.id} className="border-t border-border transition-colors hover:bg-secondary/30">
                <td className="p-3">{formatoFechaCorta(p.created_at.slice(0, 10))}</td>
                <td className="p-3">{p.cliente?.nombre ?? '—'}</td>
                <td className="p-3">{p.cita?.servicio?.nombre ?? '—'}</td>
                <td className="p-3">
                  {ETIQUETA_METODO[p.metodo]}
                  {p.codigo_operacion && (
                    <span className="ml-1 font-mono text-xs text-muted-foreground">
                      · Op. {p.codigo_operacion}
                    </span>
                  )}
                </td>
                <td className="p-3">
                  {p.comprobante ? (
                    <button
                      type="button"
                      onClick={() => setPagoVer(p)}
                      title="Ver comprobante de pago"
                      className="inline-flex items-center gap-1.5 rounded-md font-mono text-xs font-semibold text-primary underline-offset-4 transition-colors hover:underline"
                    >
                      <Receipt className="size-3.5" /> {p.comprobante}
                    </button>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="p-3 font-mono text-xs">{p.referencia}</td>
                <td className="p-3">
                  <Badge variant={ESTADO_PAGO[p.estado].variante}>{ESTADO_PAGO[p.estado].texto}</Badge>
                </td>
                <td className="p-3 text-right font-semibold text-primary">{formatoPEN(p.monto)}</td>
                <td className="p-3 text-right">
                  {p.estado === 'pendiente_caja' && (
                    <Button size="sm" onClick={() => confirmarCaja(p)} disabled={confirmandoId === p.id}>
                      {confirmandoId === p.id ? <Loader2 className="animate-spin" /> : <ClipboardCheck />}
                      Confirmar caja
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {pagos.length === 0 && (
              <tr>
                <td colSpan={9} className="p-6 text-center text-muted-foreground">
                  Aún no hay pagos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Diálogo: comprobante de pago que también ve el cliente (HU-53) */}
      <Dialog open={!!pagoVer} onOpenChange={(v) => !v && setPagoVer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Comprobante de pago</DialogTitle>
            <DialogDescription>
              {pagoVer?.cliente?.nombre} · {pagoVer && formatoPEN(pagoVer.monto)} · {pagoVer && formatoFechaCorta(pagoVer.created_at.slice(0, 10))}
            </DialogDescription>
          </DialogHeader>
          {pagoVer && <Comprobante pago={pagoVer} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
