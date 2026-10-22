// Guarda de rutas: exige sesión y (opcional) roles específicos (HU-08)
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { Rol } from '@/lib/tipos'

export function Protegido({ roles, children }: { roles?: Rol[]; children: ReactNode }) {
  const { usuario } = useAuth()

  if (!usuario) return <Navigate to="/login" replace />
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/" replace />

  return children
}
