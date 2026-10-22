// Utilidades compartidas: combinación de clases y formateo es-PE (Perú)
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** "S/ 25.00" — soles peruanos (PEN) */
export function formatoPEN(valor: number | string | null | undefined): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(Number(valor) || 0)
}

/** "2026-10-20" → "martes, 20 de octubre de 2026" */
export function formatoFecha(fecha: string): string {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** "2026-10-20" → "mar 20 oct" (versión corta para tablas) */
export function formatoFechaCorta(fecha: string): string {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-PE', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })
}

/** Fecha de hoy en formato YYYY-MM-DD local */
export function hoyISO(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

/** Valida un celular peruano escrito por el usuario: 9 dígitos que empiezan con 9 */
export function esCelularPeruano(valor: string): boolean {
  return /^9[\s-]?\d{2}[\s-]?\d{3}[\s-]?\d{3}$/.test(valor.trim())
}

/** "987654321" | "987 654 321" → "+51 987654321" (lo que espera la API) */
export function conPrefijo51(valor: string): string {
  return `+51 ${valor.replace(/[\s-]/g, '')}`
}

/** Opciones de hora 06:00 → 21:30 cada 30 minutos */
export function opcionesHora(): string[] {
  const horas: string[] = []
  for (let h = 6; h <= 21; h++) {
    horas.push(`${String(h).padStart(2, '0')}:00`)
    horas.push(`${String(h).padStart(2, '0')}:30`)
  }
  return horas
}
