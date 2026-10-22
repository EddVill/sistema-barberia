// ============================================================
//  MODO DEMO LOCAL — almacén de datos sin Supabase
//  Implementa el mismo "query builder" que usa el backend
//  (select/eq/neq/gte/in/order/limit/insert/update/delete/
//   single/maybeSingle + embeds PostgREST básicos), pero
//  guarda todo en data/db.json. Se activa automáticamente
//  cuando faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.
// ============================================================
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const ARCHIVO = process.env.DB_FILE ?? path.resolve(import.meta.dir, '../../data/db.json')

type Fila = Record<string, any>
type Datos = Record<string, Fila[]>

const TABLAS = ['usuarios', 'servicios', 'barberos', 'horarios', 'citas', 'resenas', 'pagos']

// Valores por defecto equivalentes a los DEFAULT de schema.sql
const DEFECTO: Record<string, Fila> = {
  servicios: { activo: true },
  barberos: { activo: true },
  citas: { estado: 'pendiente', estado_pago: 'pendiente' },
  pagos: { moneda: 'PEN' },
}

let datos: Datos | null = null

function cargar(): Datos {
  if (datos) return datos
  if (existsSync(ARCHIVO)) {
    datos = JSON.parse(readFileSync(ARCHIVO, 'utf8')) as Datos
  } else {
    datos = Object.fromEntries(TABLAS.map((t) => [t, []]))
  }
  return datos
}

function guardar() {
  if (!datos) return
  mkdirSync(path.dirname(ARCHIVO), { recursive: true })
  writeFileSync(ARCHIVO, JSON.stringify(datos, null, 2))
}

/** usuarios → usuario (para deducir columnas *_id) */
function singular(tabla: string): string {
  return tabla.endsWith('s') ? tabla.slice(0, -1) : tabla
}

/** Divide "*, cliente:usuarios(nombre), resenas(count)" respetando paréntesis */
function partes(cadena: string): string[] {
  const salida: string[] = []
  let nivel = 0
  let actual = ''
  for (const c of cadena) {
    if (c === '(') nivel++
    if (c === ')') nivel--
    if (c === ',' && nivel === 0) {
      salida.push(actual.trim())
      actual = ''
    } else actual += c
  }
  if (actual.trim()) salida.push(actual.trim())
  return salida
}

interface Embed {
  alias: string
  tabla: string
  cols: string
}

function parsearSelect(sel: string): { todo: boolean; columnas: string[]; embeds: Embed[] } {
  const columnas: string[] = []
  const embeds: Embed[] = []
  let todo = false
  for (const p of partes(sel)) {
    const m = p.match(/^(?:(\w+):)?(\w+)\((.*)\)$/)
    if (m) embeds.push({ alias: m[1] ?? m[2], tabla: m[2], cols: m[3] })
    else if (p === '*') todo = true
    else columnas.push(p)
  }
  return { todo, columnas, embeds }
}

/** Aplica el select a una fila: columnas planas + embeds relacionados */
function proyectar(fila: Fila, sel: string, tablaPadre: string): Fila {
  const { todo, columnas, embeds } = parsearSelect(sel)
  const base: Fila = todo
    ? { ...fila }
    : Object.fromEntries(columnas.filter((c) => c in fila).map((c) => [c, fila[c]]))

  for (const e of embeds) {
    const fk = `${singular(e.alias)}_id`
    if (fk in fila) {
      // Embed directo: citas.cliente_id → usuarios
      const rel = (cargar()[e.tabla] ?? []).find((r) => r.id === fila[fk]) ?? null
      base[e.alias] = rel ? proyectar(rel, e.cols, e.tabla) : null
    } else {
      // Embed inverso: horarios de un barbero · resenas(count) de una cita
      const fkInversa = `${singular(tablaPadre)}_id`
      const hijos = (cargar()[e.tabla] ?? []).filter((r) => r[fkInversa] === fila.id)
      base[e.alias] =
        e.cols === 'count' ? [{ count: hijos.length }] : hijos.map((h) => proyectar(h, e.cols, e.tabla))
    }
  }
  return base
}

class Consulta {
  private columnas = '*'
  private opts: Record<string, any> = {}
  private filtros: ((f: Fila) => boolean)[] = []
  private ordenes: { col: string; asc: boolean }[] = []
  private limite = 0
  private accion: 'select' | 'insert' | 'update' | 'delete' = 'select'
  private valores: any = null

  constructor(private tabla: string) {}

  select(cols = '*', opts: Record<string, any> = {}) {
    this.columnas = cols
    this.opts = opts
    return this
  }
  eq(c: string, v: any) { this.filtros.push((f) => f[c] === v); return this }
  neq(c: string, v: any) { this.filtros.push((f) => f[c] !== v); return this }
  gte(c: string, v: any) { this.filtros.push((f) => String(f[c]) >= String(v)); return this }
  in(c: string, vs: any[]) { this.filtros.push((f) => vs.includes(f[c])); return this }
  order(col: string, o: { ascending?: boolean } = {}) {
    this.ordenes.push({ col, asc: o.ascending ?? true })
    return this
  }
  limit(n: number) { this.limite = n; return this }

  insert(v: Fila | Fila[]) { this.accion = 'insert'; this.valores = v; return this }
  update(v: Fila) { this.accion = 'update'; this.valores = v; return this }
  delete() { this.accion = 'delete'; return this }

  // Permite `await consulta` igual que el cliente de Supabase
  then<T>(ok?: (r: any) => T, err?: (e: any) => T) {
    return this.ejecutar().then(ok, err)
  }

  single() {
    return this.ejecutar().then((r) =>
      r.data && r.data.length > 0
        ? { data: r.data[0], error: null }
        : { data: null, error: { message: 'Sin resultados', code: 'PGRST116' } }
    )
  }

  maybeSingle() {
    return this.ejecutar().then((r) => ({ data: r.data?.[0] ?? null, error: null }))
  }

  private ejecutar(): Promise<{ data: any; error: any; count?: number }> {
    const db = cargar()
    if (!db[this.tabla]) db[this.tabla] = []

    if (this.accion === 'insert') {
      const filas = (Array.isArray(this.valores) ? this.valores : [this.valores]).map((v) => ({
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        ...DEFECTO[this.tabla],
        ...v,
      }))
      db[this.tabla].push(...filas)
      guardar()
      return Promise.resolve({ data: filas.map((f) => proyectar(f, this.columnas, this.tabla)), error: null })
    }

    if (this.accion === 'update') {
      // Igual que supabase-js con .select(): devuelve las filas actualizadas
      // (proyectadas) para que .single()/routes funcionen correctamente.
      const actualizadas: Fila[] = []
      for (const f of db[this.tabla]) {
        if (this.filtros.every((p) => p(f))) {
          Object.assign(f, this.valores)
          actualizadas.push({ ...f })
        }
      }
      guardar()
      return Promise.resolve({
        data: actualizadas.map((f) => proyectar(f, this.columnas, this.tabla)),
        error: null,
      })
    }

    if (this.accion === 'delete') {
      db[this.tabla] = db[this.tabla].filter((f) => !this.filtros.every((p) => p(f)))
      guardar()
      return Promise.resolve({ data: null, error: null })
    }

    // SELECT
    let filas = db[this.tabla].filter((f) => this.filtros.every((p) => p(f)))
    const total = filas.length

    for (const { col, asc } of [...this.ordenes].reverse()) {
      filas = [...filas].sort((a, b) => {
        const x = a[col]
        const y = b[col]
        const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''))
        return asc ? r : -r
      })
    }
    if (this.limite > 0) filas = filas.slice(0, this.limite)

    const proyectadas = filas.map((f) => proyectar(f, this.columnas, this.tabla))
    if (this.opts.count === 'exact') {
      return Promise.resolve({ data: this.opts.head ? null : proyectadas, count: total, error: null })
    }
    return Promise.resolve({ data: proyectadas, error: null })
  }
}

export const almacenLocal = {
  from(tabla: string): Consulta {
    return new Consulta(tabla)
  },
}
