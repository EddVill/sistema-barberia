// Comprobante de pago (HU-50 y HU-51): recibo visual con numeración
// COMP-XXXXXX. Se muestra tras aprobar un pago y desde "Mis citas".
import { BadgeCheck, Printer, Scissors } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatoPEN, formatoFecha, formatoFechaCorta } from '@/lib/utils'
import type { Pago } from '@/lib/tipos'

const ETIQUETA_METODO: Record<Pago['metodo'], string> = {
  yape: 'Yape',
  plin: 'Plin',
  efectivo: 'Efectivo en caja',
}

function Fila({ etiqueta, valor, mono }: { etiqueta: string; valor: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="shrink-0 text-xs text-muted-foreground">{etiqueta}</span>
      <span className={mono ? 'text-right font-mono text-sm' : 'text-right text-sm font-medium'}>
        {valor}
      </span>
    </div>
  )
}

export function Comprobante({ pago }: { pago: Pago }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card print:border-0">
      {/* Encabezado del recibo */}
      <div className="flex items-center justify-between bg-primary px-5 py-3 text-primary-foreground">
        <div className="flex items-center gap-2">
          <Scissors className="size-4" />
          <span className="font-display tracking-widest">BARBERÍA ÉLITE</span>
        </div>
        <span className="text-[11px] uppercase tracking-wider opacity-90">Comprobante de pago</span>
      </div>

      <div className="space-y-4 p-5 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-display text-lg font-bold text-primary">{pago.comprobante}</span>
          <span className="text-xs text-muted-foreground">
            Emitido: {formatoFechaCorta(pago.created_at.slice(0, 10))}
          </span>
        </div>

        <div className="space-y-2">
          <Fila etiqueta="Cliente" valor={pago.cliente?.nombre ?? '—'} />
          <Fila etiqueta="Servicio" valor={pago.cita?.servicio?.nombre ?? '—'} />
          <Fila etiqueta="Barbero" valor={pago.cita?.barbero?.nombre ?? '—'} />
          <Fila
            etiqueta="Cita"
            valor={
              pago.cita ? `${formatoFecha(pago.cita.fecha)} · ${pago.cita.hora.slice(0, 5)}` : '—'
            }
          />
          <Fila
            etiqueta="Método"
            valor={
              ETIQUETA_METODO[pago.metodo] +
              (pago.codigo_operacion ? ` · Op. ${pago.codigo_operacion}` : '')
            }
            mono
          />
          <Fila etiqueta="Referencia" valor={pago.referencia} mono />
        </div>

        <div className="flex items-center justify-between border-t border-dashed border-border pt-3">
          <span className="font-semibold">Total pagado</span>
          <span className="font-display text-2xl font-bold text-primary">{formatoPEN(pago.monto)}</span>
        </div>

        <p className="flex items-start gap-1.5 rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
          <BadgeCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" />
          Pago verificado por la pasarela. Protección anti doble cobro: este comprobante es único
          y una misma cita no puede cobrarse dos veces.
        </p>

        <Button
          variant="secondary"
          size="sm"
          className="w-full print:hidden"
          onClick={() => window.print()}
        >
          <Printer /> Imprimir comprobante
        </Button>
      </div>
    </div>
  )
}
