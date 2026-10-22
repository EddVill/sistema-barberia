// ============================================================
//  Datos de demostración (idempotente: solo inserta si la BD
//  está vacía). Crea los usuarios de prueba listados en
//  credenciales.txt, servicios en SOLES (PEN), teléfonos
//  peruanos (+51), horarios, citas, pagos y reseñas.
//
//  Ejecutar:  bun run seed   (en modo demo es automático)
// ============================================================
import bcrypt from 'bcryptjs'
import { sb } from './lib/supabase'

const USUARIOS = [
  { nombre: 'Admin General',   email: 'admin@barberia.com',   password: 'Admin123!',   rol: 'admin',   telefono: '+51 987 111 223' },
  { nombre: 'Carlos Martínez', email: 'carlos@barberia.com',  password: 'Barbero123!', rol: 'barbero', telefono: '+51 987 444 556' },
  { nombre: 'Andrés Gómez',    email: 'andres@barberia.com',  password: 'Barbero123!', rol: 'barbero', telefono: '+51 987 777 889' },
  { nombre: 'Juan Pérez',      email: 'juan@correo.com',      password: 'Cliente123!', rol: 'cliente', telefono: '+51 998 222 334' },
]

// Precios en SOLES (PEN) — moneda oficial de Perú
const SERVICIOS = [
  { nombre: 'Corte Clásico',     descripcion: 'Tijera y máquina con lavado incluido',        precio: 25, duracion_min: 30 },
  { nombre: 'Corte + Barba',     descripcion: 'Corte perfilado con arreglo de barba',         precio: 40, duracion_min: 45 },
  { nombre: 'Afeitado Clásico',  descripcion: 'Navaja, toalla caliente y after-shave',        precio: 30, duracion_min: 40 },
  { nombre: 'Color / Tinte',     descripcion: 'Coloración profesional para caballero',        precio: 60, duracion_min: 60 },
  { nombre: 'Corte Niño',        descripcion: 'Corte para menores de 10 años',                precio: 20, duracion_min: 30 },
]

const BARBEROS = [
  { nombre: 'Carlos Martínez', especialidad: 'Corte clásico y degradados', email: 'carlos@barberia.com' },
  { nombre: 'Andrés Gómez',    especialidad: 'Barba, navaja y diseños',    email: 'andres@barberia.com' },
]

// Fecha relativa a hoy en formato YYYY-MM-DD (ej: -3 → hace 3 días)
function fechaEn(dias: number): string {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return d.toISOString().slice(0, 10)
}

export async function sembrar() {
  console.log(' Barbería Élite · datos de demostración \n')

  // Guarda de idempotencia
  const { data: existente } = await sb
    .from('usuarios')
    .select('id')
    .eq('email', 'admin@barberia.com')
    .maybeSingle()
  if (existente) {
    console.log('ℹ  La base de datos ya contiene los datos demo. Nada por hacer.')
    return
  }

  // 1) Usuarios (contraseñas hasheadas con bcrypt)
  console.log('Creando usuarios de prueba…')
  for (const u of USUARIOS) {
    const password_hash = await bcrypt.hash(u.password, 10)
    const { error } = await sb.from('usuarios').insert({
      nombre: u.nombre, email: u.email, password_hash, telefono: u.telefono, rol: u.rol,
    })
    if (error) { console.error(`  ✗ ${u.email}: ${error.message}`); process.exit(1) }
    console.log(`  ✓ ${u.rol.padEnd(7)} ${u.email}`)
  }

  // 2) Servicios (precios en PEN)
  console.log('Creando servicios (precios en soles)…')
  const { data: servicios, error: errServ } = await sb.from('servicios').insert(SERVICIOS).select('id, nombre, precio')
  if (errServ) { console.error(`  ✗ ${errServ.message}`); process.exit(1) }
  console.log(`  ✓ ${servicios!.length} servicios`)

  // 3) Barberos + vinculación con sus cuentas de usuario
  console.log('Creando barberos…')
  const { data: barberos, error: errBarb } = await sb
    .from('barberos')
    .insert(BARBEROS.map(({ nombre, especialidad }) => ({ nombre, especialidad })))
    .select('id, nombre')
  if (errBarb) { console.error(`  ✗ ${errBarb.message}`); process.exit(1) }
  for (const b of barberos!) {
    const email = b.nombre === 'Carlos Martínez' ? 'carlos@barberia.com' : 'andres@barberia.com'
    const { data: cuenta } = await sb.from('usuarios').select('id').eq('email', email).single()
    if (cuenta) await sb.from('barberos').update({ usuario_id: cuenta.id }).eq('id', b.id)
    console.log(`  ✓ ${b.nombre}`)
  }

  // 4) Horarios: Lunes a sábado, 09:00-13:00 y 14:00-19:00 (almuerzo incluido)
  console.log('Creando horarios (Lun–Sáb · 09:00–13:00 y 14:00–19:00)…')
  const filas = barberos!.flatMap((b) => {
    const rangos = []
    for (let dia = 1; dia <= 6; dia++) {
      rangos.push(
        { barbero_id: b.id, dia_semana: dia, hora_inicio: '09:00', hora_fin: '13:00' },
        { barbero_id: b.id, dia_semana: dia, hora_inicio: '14:00', hora_fin: '19:00' }
      )
    }
    return rangos
  })
  const { error: errHor } = await sb.from('horarios').insert(filas)
  if (errHor) { console.error(`  ✗ ${errHor.message}`); process.exit(1) }
  console.log(`  ✓ ${filas.length} rangos horarios`)

  // 5) Citas de ejemplo (con estado de pago)
  console.log('Creando citas de ejemplo…')
  const { data: cliente } = await sb.from('usuarios').select('id').eq('email', 'juan@correo.com').single()
  const servicio = (nombre: string) => servicios!.find((s) => s.nombre === nombre)!
  const barbero = (nombre: string) => barberos!.find((b) => b.nombre === nombre)!.id

  const { data: cita1 } = await sb
    .from('citas')
    .insert({
      cliente_id: cliente!.id, barbero_id: barbero('Carlos Martínez'), servicio_id: servicio('Afeitado Clásico').id,
      fecha: fechaEn(-5), hora: '09:00', estado: 'completada', estado_pago: 'pagado', notas: 'Cliente habitual',
    })
    .select('id, barbero_id')
    .single()
  const { data: cita2 } = await sb
    .from('citas')
    .insert({
      cliente_id: cliente!.id, barbero_id: barbero('Andrés Gómez'), servicio_id: servicio('Corte + Barba').id,
      fecha: fechaEn(1), hora: '10:30', estado: 'confirmada', estado_pago: 'pagado',
    })
    .select('id, barbero_id')
    .single()
  const { data: cita3 } = await sb
    .from('citas')
    .insert({
      cliente_id: cliente!.id, barbero_id: barbero('Carlos Martínez'), servicio_id: servicio('Corte Clásico').id,
      fecha: fechaEn(2), hora: '15:00', estado: 'pendiente', estado_pago: 'pendiente',
    })
    .select('id')
    .single()
  const { data: cita4 } = await sb
    .from('citas')
    .insert({
      cliente_id: cliente!.id, barbero_id: barbero('Andrés Gómez'), servicio_id: servicio('Corte Clásico').id,
      fecha: fechaEn(1), hora: '16:30', estado: 'pendiente', estado_pago: 'pendiente', notas: 'Paga en efectivo en caja',
    })
    .select('id')
    .single()
  if (!cita1 || !cita2 || !cita3 || !cita4) { console.error('  ✗ Error creando citas de ejemplo'); process.exit(1) }
  console.log('  ✓ 4 citas (completada, confirmada, 2 pendientes)')

  // 6) Pagos de ejemplo (pasarela demo, montos en PEN)
  console.log('Creando pagos de ejemplo…')
  const referencia = () => `PS-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
  await sb.from('pagos').insert([
    {
      cita_id: cita1.id, cliente_id: cliente!.id, monto: servicio('Afeitado Clásico').precio,
      moneda: 'PEN', metodo: 'yape', estado: 'aprobado', marca: 'Yape', referencia: referencia(),
      codigo_operacion: '481920', comprobante: 'COMP-000001', detalle: 'Pago con Yape confirmado',
    },
    {
      cita_id: cita2.id, cliente_id: cliente!.id, monto: servicio('Corte + Barba').precio,
      moneda: 'PEN', metodo: 'plin', estado: 'aprobado', marca: 'Plin', referencia: referencia(),
      codigo_operacion: '603457', telefono: '+51 998 222 334', comprobante: 'COMP-000002',
      detalle: 'Pago con Plin confirmado',
    },
    {
      cita_id: cita4.id, cliente_id: cliente!.id, monto: servicio('Corte Clásico').precio,
      moneda: 'PEN', metodo: 'efectivo', estado: 'pendiente_caja', marca: 'Efectivo', referencia: referencia(),
      detalle: 'Reserva registrada. Paga en efectivo en caja antes de tu cita: el comprobante se emite al recibir el cobro',
    },
  ])
  console.log('  ✓ 2 pagos aprobados con comprobante (Yape y Plin) + 1 efectivo pendiente de caja')

  // 7) Reseñas sobre las citas completadas
  await sb.from('resenas').insert([
    {
      cita_id: cita1.id, cliente_id: cliente!.id, barbero_id: cita1.barbero_id,
      calificacion: 5, comentario: 'Excelente atención, muy puntual y profesional.',
    },
  ])
  console.log('  ✓ 1 reseña')

  console.log('\n✔ Datos demo creados. Credenciales en credenciales.txt')
  console.log('  Admin: admin@barberia.com / Admin123!')
  console.log('  Barbero: carlos@barberia.com / Barbero123!')
  console.log('  Cliente: juan@correo.com / Cliente123!')
}

// Ejecución directa: `bun run seed`
if (import.meta.main) sembrar()
