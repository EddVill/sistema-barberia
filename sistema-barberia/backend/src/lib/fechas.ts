// Utilidades de fecha compartidas por varias rutas
export function hoyLocal(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// "2026-10-20" → día de la semana (0 = domingo … 6 = sábado).
// Se fija T12:00:00 para evitar desfases por zona horaria.
export function diaDeLaSemana(fecha: string): number {
  return new Date(`${fecha}T12:00:00`).getDay()
}
