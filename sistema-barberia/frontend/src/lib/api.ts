// Cliente HTTP mínimo: añade el token JWT y normaliza errores de la API
export class ApiError extends Error {}

export function obtenerToken(): string {
  return localStorage.getItem('barberia_token') ?? ''
}

export function guardarToken(token: string) {
  localStorage.setItem('barberia_token', token)
}

export function limpiarToken() {
  localStorage.removeItem('barberia_token')
}

export async function api<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const token = obtenerToken()
  const res = await fetch(`/api${ruta}`, {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opciones.headers ?? {}),
    },
  })

  const datos = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(datos.error ?? `Error ${res.status}`)
  return datos as T
}
