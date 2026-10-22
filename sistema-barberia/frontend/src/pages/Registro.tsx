// Registro de clientes (HU-01) con celular peruano +51.
// Las cuentas creadas aquí siempre tienen rol "cliente"; los
// barberos y admins los crea el seed/admin.
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AutenticacionLayout } from '@/components/AutenticacionLayout'
import { esCelularPeruano, conPrefijo51 } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

export default function Registro() {
  const { registrarse } = useAuth()
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [celular, setCelular] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!nombre || !email || !password) {
      toast.error('Completa nombre, email y contraseña')
      return
    }
    if (celular && !esCelularPeruano(celular)) {
      toast.error('El celular debe tener 9 dígitos y empezar con 9 (ej. 987 654 321)')
      return
    }
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setCargando(true)
    try {
      const u = await registrarse({
        nombre,
        email,
        password,
        telefono: celular ? conPrefijo51(celular) : undefined,
      })
      toast.success(`Cuenta creada. ¡Bienvenido, ${u.nombre}!`)
      navigate('/')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error de conexión')
    } finally {
      setCargando(false)
    }
  }

  return (
    <AutenticacionLayout>
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <CardTitle className="font-display text-2xl tracking-wide text-primary">CREAR CUENTA</CardTitle>
          <CardDescription>Regístrate y reserva en segundos</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={enviar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre completo</Label>
              <Input id="nombre" placeholder="Juan Pérez" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Celular (opcional)</Label>
              <div className="flex gap-2">
                <span className="flex items-center rounded-lg border border-input bg-secondary px-3 text-sm font-semibold text-muted-foreground">
                  +51
                </span>
                <Input
                  id="telefono"
                  inputMode="numeric"
                  placeholder="987 654 321"
                  value={celular}
                  onChange={(e) => setCelular(e.target.value.replace(/[^\d\s]/g, '').slice(0, 11))}
                />
              </div>
              <p className="text-xs text-muted-foreground">Celular peruano: 9 dígitos que empiezan con 9.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña (mín. 6 caracteres)</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            </div>
            <Button type="submit" className="w-full" disabled={cargando}>
              {cargando ? 'Creando cuenta…' : 'Registrarme'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Inicia sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </AutenticacionLayout>
  )
}
