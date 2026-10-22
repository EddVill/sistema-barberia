// Inicio de sesión (HU-02, HU-04). Las credenciales de prueba NO se
// muestran aquí: están documentadas en credenciales.txt en la raíz.
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AutenticacionLayout } from '@/components/AutenticacionLayout'
import { useAuth } from '@/context/AuthContext'

export default function Login() {
  const { iniciarSesion } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Completa el email y la contraseña')
      return
    }
    setCargando(true)
    try {
      const u = await iniciarSesion(email, password)
      toast.success(`Bienvenido, ${u.nombre}`)
      navigate(u.rol === 'admin' ? '/admin' : u.rol === 'barbero' ? '/barbero' : '/')
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
          <CardTitle className="font-display text-2xl tracking-wide text-primary">INICIAR SESIÓN</CardTitle>
          <CardDescription>Estilo clásico, experiencia moderna</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={enviar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={cargando}>
              {cargando ? 'Ingresando…' : 'Iniciar sesión'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="font-medium text-primary hover:underline">
              Regístrate
            </Link>
          </p>
        </CardContent>
      </Card>
    </AutenticacionLayout>
  )
}
