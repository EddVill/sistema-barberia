// ============================================================
//  API — Sistema de Barbería "Élite"
//  ElysiaJS 1.4 + Supabase (PostgreSQL)
//  Arranque:  bun run dev   (recarga automática)
//  Documentación OpenAPI: http://localhost:3001/openapi
// ============================================================
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { openapi } from '@elysiajs/openapi'

import { authRoutes } from './routes/auth'
import { usuariosRoutes } from './routes/usuarios'
import { serviciosPublicos, serviciosAdmin } from './routes/servicios'
import { barberosPublicos, barberosAdmin } from './routes/barberos'
import { disponibilidadPublica, citasRoutes } from './routes/citas'
import { resenasPublicas, resenasRoutes } from './routes/resenas'
import { pagosRoutes, pagosAdminRoutes } from './routes/pagos'
import { dashboardRoutes } from './routes/dashboard'
import { modoLocal } from './lib/supabase'
import { sembrar } from './seed'

// En modo demo (sin Supabase) los datos de ejemplo se siembran solos
if (modoLocal) await sembrar()

const app = new Elysia()
  // CORS abierto para desarrollo (el frontend corre en :5173)
  .use(cors())

  // Documentación interactiva generada automáticamente (HU-40)
  .use(
    openapi({
      documentation: {
        info: {
          title: 'API — Sistema de Barbería "Élite"',
          version: '1.0.0',
          description:
            'API REST con autenticación JWT, catálogo de servicios, barberos, horarios, reservas, reseñas y reportes.',
        },
        tags: [
          { name: 'Autenticación', description: 'Registro e inicio de sesión' },
          { name: 'Usuarios', description: 'Perfil del usuario autenticado' },
          { name: 'Servicios', description: 'Catálogo de servicios' },
          { name: 'Barberos', description: 'Equipo y horarios de atención' },
          { name: 'Citas', description: 'Disponibilidad y reservas' },
          { name: 'Reseñas', description: 'Valoraciones de clientes' },
          { name: 'Pagos', description: 'Pasarela de pagos en soles (PEN)' },
          { name: 'Dashboard', description: 'Indicadores administrativos' },
          { name: 'General', description: 'Endpoints de estado' },
        ],
      },
    })
  )

  // Endpoint de salud (HU-45)
  .get(
    '/api/salud',
    () => ({ ok: true, mensaje: 'API de Barbería Élite funcionando' }),
    { detail: { tags: ['General'], summary: 'Health check (público)' } }
  )

  // Rutas de negocio (cada archivo agrupa y protege sus endpoints)
  .use(authRoutes)
  .use(usuariosRoutes)
  .use(serviciosPublicos)
  .use(serviciosAdmin)
  .use(barberosPublicos)
  .use(barberosAdmin)
  .use(disponibilidadPublica)
  .use(citasRoutes)
  .use(resenasPublicas)
  .use(resenasRoutes)
  .use(pagosRoutes)
  .use(pagosAdminRoutes)
  .use(dashboardRoutes)

  .listen(process.env.PORT ?? 3001)

console.log(`✂  API Barbería Élite  →  http://localhost:${app.server?.port}`)
console.log(`📚 Documentación OpenAPI  →  http://localhost:${app.server?.port}/openapi`)
