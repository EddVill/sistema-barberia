-- ============================================================
--  SISTEMA DE BARBERÍA "ÉLITE" — Esquema de base de datos
--  Motor: PostgreSQL (Supabase)
--  Cómo usarlo: pega todo este script en el SQL Editor de
--  Supabase y ejecútalo (Run). Es idempotente: puede
--  re-ejecutarse sin duplicar tablas.
-- ============================================================

-- Limpieza previa (orden inverso de dependencias)
drop table if exists pagos    cascade;
drop table if exists resenas   cascade;
drop table if exists citas     cascade;
drop table if exists horarios  cascade;
drop table if exists barberos  cascade;
drop table if exists servicios cascade;
drop table if exists usuarios  cascade;

-- ------------------------------------------------------------
-- usuarios: clientes, barberos y administradores del sistema
-- ------------------------------------------------------------
create table usuarios (
  id            uuid        primary key default gen_random_uuid(),
  nombre        text        not null,
  email         text        not null unique,
  password_hash text        not null,            -- bcrypt (nunca texto plano)
  rol           text        not null default 'cliente'
                            check (rol in ('cliente', 'barbero', 'admin')),
  telefono      text,
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- servicios: catálogo ofrecido por la barbería
-- ------------------------------------------------------------
create table servicios (
  id           uuid          primary key default gen_random_uuid(),
  nombre       text          not null,
  descripcion  text,
  precio       numeric(10,2) not null check (precio >= 0),
  duracion_min int           not null default 30 check (duracion_min > 0),
  activo       boolean       not null default true,   -- borrado lógico
  created_at   timestamptz   not null default now()
);

-- ------------------------------------------------------------
-- barberos: equipo de la barbería (vinculación opcional a una
-- cuenta de usuario con rol 'barbero')
-- ------------------------------------------------------------
create table barberos (
  id           uuid        primary key default gen_random_uuid(),
  usuario_id   uuid        references usuarios(id) on delete set null,
  nombre       text        not null,
  especialidad text,
  activo       boolean     not null default true,
  created_at   timestamptz not null default now()
);

-- ------------------------------------------------------------
-- horarios: disponibilidad semanal por barbero
-- dia_semana: 0 = domingo … 6 = sábado
-- Permite varios rangos por día (ej. 09:00-13:00 y 14:00-19:00)
-- ------------------------------------------------------------
create table horarios (
  id          uuid   primary key default gen_random_uuid(),
  barbero_id  uuid   not null references barberos(id) on delete cascade,
  dia_semana  int    not null check (dia_semana between 0 and 6),
  hora_inicio time   not null,
  hora_fin    time   not null,
  check (hora_fin > hora_inicio)
);

-- ------------------------------------------------------------
-- citas: reservas de los clientes
-- Ciclo de vida: pendiente → confirmada → completada
--               (o cancelada desde pendiente/confirmada)
-- ------------------------------------------------------------
create table citas (
  id          uuid        primary key default gen_random_uuid(),
  cliente_id  uuid        not null references usuarios(id)  on delete cascade,
  barbero_id  uuid        not null references barberos(id)  on delete cascade,
  servicio_id uuid        not null references servicios(id) on delete restrict,
  fecha       date        not null,
  hora        time        not null,
  estado      text        not null default 'pendiente'
                          check (estado in ('pendiente','confirmada','completada','cancelada')),
  estado_pago text        not null default 'pendiente'
                          check (estado_pago in ('pendiente','pagado')),
  notas       text,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- resenas: valoraciones de citas completadas
-- cita_id UNIQUE → una sola reseña por cita (a nivel de BD)
-- ------------------------------------------------------------
create table resenas (
  id           uuid        primary key default gen_random_uuid(),
  cita_id      uuid        not null unique references citas(id)    on delete cascade,
  cliente_id   uuid        not null references usuarios(id)        on delete cascade,
  barbero_id   uuid        not null references barberos(id)        on delete cascade,
  calificacion int         not null check (calificacion between 1 and 5),
  comentario   text,
  created_at   timestamptz not null default now()
);

-- ------------------------------------------------------------
-- pagos: transacciones de la pasarela (simulada) en SOLES
-- metodos: yape · plin · efectivo
-- estados: aprobado · rechazado · pendiente_caja (efectivo en caja)
-- Un pago aprobado deja la cita con estado_pago = 'pagado' y emite
-- un comprobante con numeración secuencial (COMP-000001, …).
-- ------------------------------------------------------------
create table pagos (
  id               uuid          primary key default gen_random_uuid(),
  cita_id          uuid          not null references citas(id)    on delete cascade,
  cliente_id       uuid          not null references usuarios(id) on delete cascade,
  monto            numeric(10,2) not null check (monto >= 0),   -- en PEN (S/)
  moneda           text          not null default 'PEN' check (moneda = 'PEN'),
  metodo           text          not null check (metodo in ('yape','plin','efectivo')),
  estado           text          not null check (estado in ('aprobado','rechazado','pendiente_caja')),
  marca            text,                                        -- Yape, Plin, Efectivo
  referencia       text          not null,                      -- código de transacción
  codigo_operacion text,                                        -- código Yape/Plin (6 dígitos)
  telefono         text,                                        -- celular Plin del pagador
  comprobante      text          unique,                        -- COMP-000001, COMP-000002…
  detalle          text,                                        -- mensaje de la pasarela
  created_at       timestamptz   not null default now()
);

-- ------------------------------------------------------------
-- Índices para las consultas más frecuentes
-- ------------------------------------------------------------
create index idx_usuarios_email      on usuarios(email);
create index idx_citas_cliente       on citas(cliente_id);
create index idx_citas_barbero_fecha on citas(barbero_id, fecha);
create index idx_citas_estado        on citas(estado);
create index idx_horarios_barbero    on horarios(barbero_id, dia_semana);
create index idx_resenas_barbero     on resenas(barbero_id);
create index idx_pagos_cliente       on pagos(cliente_id);
create index idx_pagos_cita          on pagos(cita_id);

-- ------------------------------------------------------------
-- PROTECCIÓN ANTI DOBLE COBRO (índices únicos parciales)
-- ------------------------------------------------------------
-- 1) Una cita solo puede tener UN pago aprobado: aunque dos
--    solicitudes lleguen a la vez, la base de datos rechaza la segunda.
create unique index pagos_cita_aprobada_unica
  on pagos(cita_id) where estado = 'aprobado';

-- 2) Cada código de operación Yape/Plin se acepta UNA sola vez
--    entre los pagos aprobados (un mismo comprobante de la app
--    no puede pagar varias citas).
create unique index pagos_codigo_unico
  on pagos(codigo_operacion)
  where codigo_operacion is not null and estado = 'aprobado';

-- ------------------------------------------------------------
-- NOTA SOBRE SEGURIDAD (RLS)
-- El backend se conecta con la SERVICE ROLE KEY, que omite RLS;
-- por eso no se definen políticas aquí. No expongas esa clave
-- al frontend ni a terceros. Si algún día consultas las tablas
-- directamente desde el cliente, deberás habilitar RLS y crear
-- las políticas correspondientes.
-- ------------------------------------------------------------
