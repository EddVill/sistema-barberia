# ✂ Sistema de Barbería "Élite"

Sistema full-stack de gestión de barbería con **reservas en línea**, **pasarela de pagos en soles (PEN)**, catálogo de servicios, gestión de barberos y horarios, reseñas y panel administrativo. Pensado para Perú: **precios en soles** y **celulares +51**.

> 📄 **Documentación entregada** (carpeta `download/`): *Historias de Usuario y Prototipo* (55 HU, v1.2) y *Guía de Instalación en VSCode y Frameworks* (paso a paso para levantar el sistema y explicación de cada tecnología).

| Capa | Tecnología | Versión |
|---|---|---|
| Backend | **ElysiaJS** (sobre Bun) + **Supabase** (PostgreSQL) | Elysia **1.4.30** (última) |
| Frontend | **React** + **Vite** + **Tailwind CSS** + **shadcn/ui** + embla-carousel | React 19.3 · Vite 8 · Tailwind 4.3 |
| Autenticación | JWT (Bearer) + bcrypt | — |
| Pagos | Pasarela simulada **PagoSeguro PE**: **Yape · Plin · efectivo** | moneda PEN · comprobantes COMP-XXXXXX |
| Documentación API | `@elysiajs/openapi` (Scalar UI) | auto-generada |

---

## ✨ Funcionalidades

- **Autenticación completa**: registro público (rol cliente) con **celular peruano +51**, login con JWT, sesión persistente, guards por rol en servidor (cliente / barbero / admin). Las credenciales de prueba viven en `credenciales.txt`, nunca en el login.
- **Catálogo de servicios**: público, con **precios en soles (S/)** y duración; CRUD para administrador con borrado lógico.
- **Barberos y horarios**: equipo con especialidades; horarios semanales por barbero con dos rangos por día (mañana/tarde).
- **Reservas en 4 pasos**: servicio → barbero → fecha y hora → **pago**. El sistema calcula la **disponibilidad real** (turnos de 30 min, excluyendo horas ocupadas y pasadas) e **impide reservas duplicadas** en el servidor.
- **Pasarela de pagos (demo)**: **Yape** (número de la barbería + código de operación de 6 dígitos), **Plin** (celular +51 + código de operación) y **efectivo en caja** (el admin confirma el cobro recibido). El monto lo fija el servidor en PEN; un pago aprobado **confirma la cita automáticamente** y emite el **comprobante**. Estructura lista para conectar el API real de Yape/Plin, Mercado Pago o Culqi (ver `backend/src/lib/pasarela.ts`).
- **Protección anti doble cobro (3 niveles)**: el servidor rechaza con 409 una cita ya pagada y un código de operación repetido, y PostgreSQL lo garantiza con **índices únicos parciales** (`pagos_cita_aprobada_unica`, `pagos_codigo_unico`) aunque dos solicitudes lleguen a la vez.
- **Comprobantes de pago**: cada pago aprobado emite un recibo numerado secuencial (COMP-000001, COMP-000002…) con cliente, servicio, barbero, método, código de operación, referencia y total; visible desde **Mis Citas → Ver comprobante** (imprimible) y en el panel **Pagos** del admin, que además confirma los efectivos en caja y puede **abrir el comprobante de cada pago**.
- **Footer con redes sociales**: el pie de página muestra solo el nombre de la empresa y sus redes (Facebook, Instagram, WhatsApp, TikTok). Edítalas en `frontend/src/components/Layout.tsx`, en la constante `REDES` al inicio del archivo (añade, quita o cambia las URLs).
- **Sliders (carruseles)**: hero de la portada, panel derecho de Login/Registro y carrusel de reseñas — todos con autoplay, flechas y puntos (embla-carousel).
- **Gestión de citas**: el barbero confirma/completa/cancela sus citas; el admin gestiona todas con filtros y ve el estado de pago.
- **Reseñas**: valoración de 1 a 5 estrellas en citas completadas (única por cita, garantizada en BD).
- **Dashboard admin**: KPIs del negocio + página de **Pagos** con total en soles.
- **Modo demo sin configuración**: si no hay credenciales de Supabase, el backend guarda los datos en `backend/data/db.json` y siembra datos de ejemplo automáticamente (ideal para probar sin instalar nada).
- **Documentación OpenAPI** interactiva generada automáticamente.

## 🗂 Estructura del proyecto

```
sistema-barberia/
├── README.md                 ← este archivo
├── credenciales.txt          ← cuentas de prueba (admin/barbero/cliente)
├── docs/
│   ├── historias-de-usuario.md   ← 53 HU en 9 épicas con criterios de aceptación
│   └── prototipo.html        ← prototipo navegable (ábrela en el navegador)
├── database/
│   └── schema.sql            ← esquema completo para el SQL Editor de Supabase
├── backend/                  ← API ElysiaJS + Supabase (se ejecuta con Bun)
│   ├── .env.example          ← copiar como .env y completar (opcional: modo demo)
│   └── src/
│       ├── index.ts          ← servidor (CORS + OpenAPI + rutas)
│       ├── seed.ts           ← datos demo (precios PEN, celulares +51)
│       ├── lib/              ← supabase (o modo demo local), pasarela, JWT/guards, fechas
│       └── routes/           ← auth, usuarios, servicios, barberos,
│                                citas, resenas, pagos, dashboard
└── frontend/                 ← SPA React + Vite + Tailwind 4 + shadcn/ui
    ├── public/img/           ← imágenes de los sliders
    └── src/
        ├── components/ui/    ← componentes shadcn (button, card, dialog…)
        ├── components/       ← Slider (embla), PagoForm, EstadoBadge, Layout…
        ├── context/          ← AuthContext (token + sesión)
        ├── lib/              ← cliente HTTP, tipos, utilidades es-PE (soles)
        └── pages/            ← Login, Registro, Inicio, Reservar (4 pasos),
                                 MisCitas, CitasBarbero, admin/*
```

## 🚀 Puesta en marcha

### 0. Requisitos previos

- **[Bun](https://bun.sh)** ≥ 1.2 (backend) — `curl -fsSL https://bun.sh/install | bash`
- **Node.js** ≥ 20.19 (frontend)

### 1. (Opcional) Base de datos real con Supabase

> **Sin Supabase el sistema funciona igual**: arranca en **MODO DEMO LOCAL** y guarda los datos en `backend/data/db.json`. Si quieres PostgreSQL real:

1. Crea un proyecto en supabase.com (plan gratuito).
2. Abre **SQL Editor → New query**, pega todo el contenido de `database/schema.sql` y pulsa **Run**.
3. En **Project Settings → API** copia la **Project URL** y la **service_role key**.

### 2. Backend

```bash
cd backend
bun install
bun run dev                 # API en http://localhost:3001 (recarga automática)
```

- Con credenciales: copia `.env.example` como `.env` antes de arrancar.
- Sin credenciales: verás `MODO DEMO LOCAL` y los datos de ejemplo se siembran solos (también puedes forzarlos con `bun run seed`).

> Documentación interactiva: <http://localhost:3001/openapi> · Salud: <http://localhost:3001/api/salud>

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                 # app en http://localhost:5173
```

El frontend llama a `/api/...` y **Vite redirige automáticamente** al backend en el puerto 3001 (proxy configurado en `vite.config.ts`): no necesitas tocar CORS ni URLs.

### 4. Iniciar sesión

Usa las cuentas del archivo **`credenciales.txt`** (también las imprime el seed):

| Rol | Email | Contraseña |
|---|---|---|
| Admin | `admin@barberia.com` | `Admin123!` |
| Barbero | `carlos@barberia.com` | `Barbero123!` |
| Cliente | `juan@correo.com` | `Cliente123!` |

### 5. Probar la pasarela de pagos

1. Entra como cliente y ve a **Reservar**: elige servicio → barbero → fecha/hora.
2. En el **paso 4** elige método:
   - **Yape**: paga al número mostrado (+51 987 654 321) y registra cualquier código de operación de 6 dígitos → comprobante COMP-XXXXXX al instante.
   - **Plin**: celular `+51 9XXXXXXXX` + código de 6 dígitos → ídem.
   - **Efectivo**: queda «Pendiente en caja»; el admin lo confirma en **Pagos → Confirmar caja** y ahí se emite el comprobante.
3. Comprueba el anti doble cobro: reintenta pagar la misma cita o reutiliza el mismo código → el sistema responde **409** en ambos casos.
4. Como admin revisa **Pagos** para ver comprobantes, pendientes de caja y el total recaudado en soles.

## 🧭 Módulos ↔ Historias de usuario

Las **55 historias de usuario** (9 épicas) están en `docs/historias-de-usuario.md`, con su matriz de trazabilidad. Resumen:

| Épica | Implementada en |
|---|---|
| E1 Autenticación (HU-01…08) | `routes/auth.ts`, `lib/auth.ts` · `Login`, `Registro`, `AuthContext` |
| E2 Servicios (HU-09…13) | `routes/servicios.ts` · `AdminServicios`, `Inicio`, `Reservar` |
| E3 Barberos (HU-14…19) | `routes/barberos.ts` · `AdminBarberos` |
| E4 Reservas (HU-20…28) | `routes/citas.ts` · `Reservar`, `MisCitas` |
| E5 Gestión de citas (HU-29…33) | `routes/citas.ts` · `CitasBarbero`, `AdminCitas` |
| E6 Reseñas (HU-34…36) | `routes/resenas.ts` · `MisCitas`, `Inicio` |
| E7 Reportes (HU-37…40) | `routes/dashboard.ts` · `Dashboard`, `/openapi` |
| E8 Experiencia (HU-41…45) | `Layout`, `Slider` (embla), `index.css`, sonner, `EstadoBadge`, `/api/salud` |
| E9 Pagos (HU-46…55) | `routes/pagos.ts`, `lib/pasarela.ts` · `PagoForm`, `Comprobante`, `Reservar` (paso 4), `MisCitas`, `admin/PagosAdmin` |

## 📡 Resumen de la API

| Método y ruta | Acceso | Descripción |
|---|---|---|
| `POST /api/auth/registro` | público | Crear cuenta cliente (celular +51 válido) |
| `POST /api/auth/login` | público | Iniciar sesión (JWT) |
| `GET /api/perfil` · `PUT /api/perfil` | auth | Ver / editar perfil |
| `GET /api/servicios` | público | Catálogo activo (precios PEN) |
| `GET /api/servicios/admin` | admin | Todos los servicios |
| `POST /api/servicios` · `PUT /:id` · `DELETE /:id` | admin | CRUD (DELETE = lógico) |
| `GET /api/barberos` (+ `/admin`) | público / admin | Equipo con horarios |
| `POST /api/barberos` · `PUT /:id` · `DELETE /:id` | admin | CRUD |
| `PUT /api/barberos/:id/horarios` | admin | Reemplazar semana completa |
| `GET /api/disponibilidad?barbero_id&fecha` | público | Turnos de 30 min disponibles |
| `GET /api/citas` | auth | Cliente→propias, barbero→asignadas, admin→todas |
| `POST /api/citas` | auth | Crear reserva (valida solapamiento) |
| `PATCH /api/citas/:id/estado` | admin/barbero | Cambiar estado |
| `DELETE /api/citas/:id` | dueño/admin | Cancelar (lógico) |
| `GET /api/resenas?barbero_id` | público | Últimas reseñas |
| `POST /api/resenas` | auth | Valorar cita completada (única) |
| `POST /api/pagos` | auth | Cobrar cita: Yape/Plin/efectivo (PEN) + comprobante |
| `GET /api/pagos/mios` | auth | Historial de pagos propios |
| `GET /api/pagos/cita/:cita_id` | auth (dueño/admin) | Comprobante del pago aprobado de una cita |
| `POST /api/pagos/:id/confirmar-efectivo` | admin | Confirmar cobro en efectivo y emitir comprobante |
| `GET /api/pagos` | admin | Todos los pagos (total recaudado) |
| `GET /api/dashboard` | admin | KPIs e ingresos del mes |
| `GET /api/salud` | público | Health check |

## 🧪 Solución de problemas

| Problema | Solución |
|---|---|
| Quiero PostgreSQL real | Copia `.env.example` como `.env` dentro de `backend/`, ejecuta `schema.sql` en Supabase y reinicia. |
| Quiero reiniciar el modo demo | Borra `backend/data/db.json` y reinicia el backend (o ejecuta `bun run seed`). |
| Frontend: "Error de conexión" | Verifica que el backend esté corriendo en el puerto 3001 (el proxy de Vite lo necesita). |
| Login: "Credenciales inválidas" | Ejecuta `bun run seed` para crear los usuarios de prueba. |
| `Ese horario ya está reservado` | Es la validación anti-solapamiento; elige otra hora. |
| `Esta cita ya fue pagada` | Protección anti doble cobro: la cita ya tiene un pago aprobado. |
| Registro rechaza mi teléfono | Usa un celular peruano: `+51` + 9 dígitos que empiecen con 9 (ej. `987 654 321`). |

## 🔒 Notas de seguridad

- El backend usa la **service_role key**, que omite RLS: nunca la expongas en el frontend ni en repositorios públicos (`.env` está en `.gitignore`).
- Las contraseñas se guardan con **bcrypt** (hash + salt), nunca en texto plano.
- Los roles se validan **en el servidor** en cada endpoint protegido, no solo en la interfaz.
- El **monto** de cada pago lo calcula el servidor a partir del precio del servicio; el cliente no puede alterarlo.
- La pasarela incluida es una **simulación segura para demo**: para producción reemplaza `procesarPago` en `backend/src/lib/pasarela.ts` por el SDK de tu proveedor (Mercado Pago, Culqi, Niubiz…).
