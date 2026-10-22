// ============================================================
//  PASARELA DE PAGOS (simulada) — "PagoSeguro PE"
//  Procesa cobros en SOLES (PEN) con los 3 métodos peruanos:
//    · yape     — código de operación de 6 dígitos de la app Yape
//    · plin     — celular +51 9XXXXXXXX + código de operación
//    · efectivo — se paga en caja; el administrador confirma el
//                 cobro y recién entonces se emite el comprobante
//
//  Cada pago aprobado emite un COMPROBANTE DE PAGO con
//  numeración secuencial (COMP-000001, COMP-000002, …).
//
//  PROTECCIÓN ANTI DOBLE COBRO (en routes/pagos.ts + BD):
//    1. Una cita con pago aprobado no puede volver a cobrarse.
//    2. Un código de operación Yape/Plin solo se acepta una vez.
//    3. El número de comprobante es único en todo el sistema.
//
//  INTEGRACIÓN REAL: para conectar el API oficial de Yape/Plin
//  (o un agregador como Mercado Pago, Culqi o Niubiz) reemplaza
//  el cuerpo de `procesarPago` por la llamada al proveedor y
//  configura su token en .env. El resto del sistema no cambia:
//  pagos y citas usan esta interfaz.
// ============================================================

export type MetodoPago = 'yape' | 'plin' | 'efectivo'
export type EstadoPasarela = 'aprobado' | 'rechazado' | 'pendiente_caja'

export interface SolicitudPago {
  metodo: MetodoPago
  monto: number                       // en soles
  codigo?: string                     // código de operación Yape/Plin (6 dígitos)
  telefono?: string                   // celular Plin del pagador (+51)
}

export interface ResultadoPago {
  estado: EstadoPasarela
  mensaje: string
  marca: string                       // Yape | Plin | Efectivo
  referencia: string                  // código de transacción de la pasarela
}

/** Código de operación de la app: exactamente 6 dígitos */
export const CODIGO_VALIDO = (codigo?: string) => /^\d{6}$/.test((codigo ?? '').trim())

/** Celular peruano Plin: +51 seguido de 9 dígitos que empiezan con 9 */
export const CELULAR_VALIDO = (telefono?: string) =>
  /^\+519\d{8}$/.test((telefono ?? '').replace(/[\s-]/g, ''))

export function procesarPago(s: SolicitudPago): ResultadoPago {
  const referencia = `PS-${crypto.randomUUID().slice(0, 8).toUpperCase()}`

  if (s.metodo === 'yape') {
    if (!CODIGO_VALIDO(s.codigo)) {
      return { estado: 'rechazado', mensaje: 'El código de operación de Yape debe tener 6 dígitos', marca: 'Yape', referencia }
    }
    return { estado: 'aprobado', mensaje: 'Pago con Yape confirmado', marca: 'Yape', referencia }
  }

  if (s.metodo === 'plin') {
    if (!CELULAR_VALIDO(s.telefono)) {
      return { estado: 'rechazado', mensaje: 'El celular Plin debe ser +51 seguido de 9 dígitos que empiecen con 9', marca: 'Plin', referencia }
    }
    if (!CODIGO_VALIDO(s.codigo)) {
      return { estado: 'rechazado', mensaje: 'Ingresa el código de operación de Plin (6 dígitos)', marca: 'Plin', referencia }
    }
    return { estado: 'aprobado', mensaje: 'Pago con Plin confirmado', marca: 'Plin', referencia }
  }

  // efectivo — la reserva queda pendiente hasta que la caja reciba
  // el dinero y el administrador confirme el cobro (comprobante ahí)
  return {
    estado: 'pendiente_caja',
    mensaje: 'Reserva registrada. Paga en efectivo en caja antes de tu cita: el comprobante se emite al recibir el cobro',
    marca: 'Efectivo',
    referencia,
  }
}

/** Número de comprobante secuencial COMP-000001, COMP-000002, … */
export async function siguienteComprobante(): Promise<string> {
  const { sb } = await import('./supabase')
  const { data } = await sb.from('pagos').select('comprobante')
  const maximo = (data ?? []).reduce((max, p) => {
    const n = Number(String(p.comprobante ?? '').replace(/\D/g, ''))
    return Number.isFinite(n) && n > max ? n : max
  }, 0)
  return `COMP-${String(maximo + 1).padStart(6, '0')}`
}
