// Contexto de autenticación: sesión persistente en localStorage (HU-02…HU-05)
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, guardarToken, limpiarToken } from '@/lib/api'
import type { UsuarioAuth } from '@/lib/tipos'

interface DatosRegistro {
  nombre: string
  email: string
  password: string
  telefono?: string
}

interface AuthContexto {
  usuario: UsuarioAuth | null
  iniciarSesion: (email: string, password: string) => Promise<UsuarioAuth>
  registrarse: (datos: DatosRegistro) => Promise<UsuarioAuth>
  cerrarSesion: () => void
}

const Contexto = createContext<AuthContexto | null>(null)

export function ProveedorAuth({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioAuth | null>(() => {
    try {
      return JSON.parse(localStorage.getItem('barberia_usuario') ?? 'null') as UsuarioAuth | null
    } catch {
      return null
    }
  })

  // Sincroniza el perfil en localStorage (el token lo gestiona lib/api)
  useEffect(() => {
    if (usuario) localStorage.setItem('barberia_usuario', JSON.stringify(usuario))
    else localStorage.removeItem('barberia_usuario')
  }, [usuario])

  async function iniciarSesion(email: string, password: string) {
    const r = await api<{ token: string; usuario: UsuarioAuth }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    guardarToken(r.token)
    setUsuario(r.usuario)
    return r.usuario
  }

  async function registrarse(datos: DatosRegistro) {
    const r = await api<{ token: string; usuario: UsuarioAuth }>('/auth/registro', {
      method: 'POST',
      body: JSON.stringify(datos),
    })
    guardarToken(r.token)
    setUsuario(r.usuario)
    return r.usuario
  }

  function cerrarSesion() {
    limpiarToken()
    setUsuario(null)
  }

  return (
    <Contexto.Provider value={{ usuario, iniciarSesion, registrarse, cerrarSesion }}>
      {children}
    </Contexto.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('useAuth debe usarse dentro de ProveedorAuth')
  return ctx
}
