// Tipos de datos que devuelve la API
export type Rol = 'cliente' | 'barbero' | 'admin'
export type EstadoCita = 'pendiente' | 'confirmada' | 'completada' | 'cancelada'
export type EstadoPago = 'pendiente' | 'pagado'
export type MetodoPago = 'yape' | 'plin' | 'efectivo'
export type EstadoTransaccion = 'aprobado' | 'rechazado' | 'pendiente_caja'

export interface UsuarioAuth {
  id: string
  nombre: string
  email: string
  rol: Rol
}

export interface Servicio {
  id: string
  nombre: string
  descripcion: string | null
  precio: string | number
  duracion_min: number
  activo: boolean
}

export interface Horario {
  dia_semana: number
  hora_inicio: string
  hora_fin: string
}

export interface Barbero {
  id: string
  nombre: string
  especialidad: string | null
  activo: boolean
  horarios?: Horario[]
}

export interface Cita {
  id: string
  cliente_id: string
  barbero_id: string
  servicio_id: string
  fecha: string
  hora: string
  estado: EstadoCita
  estado_pago: EstadoPago
  notas: string | null
  cliente?: { nombre: string; email?: string }
  barbero?: { nombre: string }
  servicio?: { nombre: string; precio?: string | number }
  resenas?: { count: number }[]
}

export interface Pago {
  id: string
  cita_id: string
  cliente_id: string
  monto: number
  moneda: 'PEN'
  metodo: MetodoPago
  estado: EstadoTransaccion
  marca: string | null
  referencia: string
  codigo_operacion: string | null
  telefono: string | null
  comprobante: string | null
  detalle: string | null
  created_at: string
  cita?: { fecha: string; hora: string; estado?: EstadoCita; servicio?: { nombre: string } | null; barbero?: { nombre: string } | null }
  cliente?: { nombre: string; email?: string } | null
}

export interface Resena {
  id: string
  cita_id: string
  calificacion: number
  comentario: string | null
  cliente?: { nombre: string }
  barbero?: { nombre: string }
  created_at?: string
}

export interface DashboardDatos {
  citas_hoy: number
  citas_pendientes: number
  clientes_registrados: number
  ingresos_mes: number
  por_estado: Record<EstadoCita, number>
  proximas_hoy: Cita[]
}
