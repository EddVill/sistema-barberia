// Insignia visual del estado de una cita y de su pago (HU-44)
import { Badge } from '@/components/ui/badge'
import type { EstadoCita, EstadoPago } from '@/lib/tipos'

const variantes: Record<EstadoCita, 'warning' | 'info' | 'success' | 'destructive'> = {
  pendiente: 'warning',
  confirmada: 'info',
  completada: 'success',
  cancelada: 'destructive',
}

const etiquetas: Record<EstadoCita, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  completada: 'Completada',
  cancelada: 'Cancelada',
}

export function EstadoBadge({ estado }: { estado: EstadoCita }) {
  return <Badge variant={variantes[estado]}>{etiquetas[estado]}</Badge>
}

const variantesPago: Record<EstadoPago, 'success' | 'warning'> = {
  pagado: 'success',
  pendiente: 'warning',
}

const etiquetasPago: Record<EstadoPago, string> = {
  pagado: 'Pagado',
  pendiente: 'Pendiente de pago',
}

export function EstadoPagoBadge({ estado }: { estado: EstadoPago }) {
  return <Badge variant={variantesPago[estado]}>{etiquetasPago[estado]}</Badge>
}
