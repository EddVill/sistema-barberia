// Autenticación: verificación de token JWT y guardas por rol.
// Elysia permite crear "plugins" reutilizables con .derive(): el objeto
// devuelto (aquí `usuario`) queda disponible dentro de los handlers.
import Elysia from 'elysia'
import { jwt } from '@elysiajs/jwt'

export interface TokenPayload {
  sub: string                                  // id del usuario
  email: string
  nombre: string
  rol: 'cliente' | 'barbero' | 'admin'
}

// Plugin JWT compartido por toda la API
// .as('scoped') propaga el contexto `jwt` a la instancia que lo use
// (comportamiento de scopes de Elysia 1.3+)
export const jsonWebToken = new Elysia({ name: 'jwt-barberia' })
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET ?? 'secreto-demo-barberia',
      exp: '7d', // HU-05: la sesión dura 7 días
    })
  )
  .as('scoped')

// Requiere un token válido → expone `usuario` en el handler
export const requiereAuth = new Elysia({ name: 'auth' })
  .use(jsonWebToken)
  .derive(async ({ jwt, headers, status }) => {
    const token = headers.authorization?.replace('Bearer ', '')
    if (!token) throw status(401, { error: 'Token no proporcionado' })

    const payload = await jwt.verify(token)
    if (!payload) throw status(401, { error: 'Token inválido o expirado' })

    return { usuario: payload as unknown as TokenPayload }
  })
  .as('scoped')

// Requiere rol administrador → HU-08
export const requiereAdmin = new Elysia({ name: 'auth-admin' })
  .use(requiereAuth)
  .derive(({ usuario, status }) => {
    if (usuario.rol !== 'admin') throw status(403, { error: 'Requiere rol administrador' })
  })
  .as('scoped')
