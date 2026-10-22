# Historias de Usuario — Sistema de Barbería "Élite"

**Proyecto:** Sistema de gestión de barbería con reservas en línea y pasarela de pagos
**Versión:** 1.2 · **Fecha:** octubre 2026 · **Moneda:** soles peruanos (PEN) · **Celulares:** +51 (Perú)
**Stack:** ElysiaJS 1.4 + Supabase (PostgreSQL) · React 19 + Vite 8 + Tailwind CSS 4 + shadcn/ui

---

## 1. Descripción general

Este documento recoge las historias de usuario (HU) que definen el alcance funcional del sistema. Cada historia sigue el formato estándar *"Como [rol], quiero [acción], para [beneficio]"* y se acompaña de sus criterios de aceptación, que describen de forma verificable cuándo la historia está completa.

### 1.1 Actores del sistema

| Actor | Descripción |
|---|---|
| **Cliente** | Persona que se registra, explora el catálogo y reserva citas con los barberos. |
| **Barbero** | Profesional que atiende las citas asignadas y gestiona su estado (confirmar, completar). |
| **Administrador** | Gestiona servicios, barberos, horarios, todas las citas y consulta reportes. |

### 1.2 Convenciones

- Los ID son consecutivos (`HU-01` … `HU-55`) y agrupados por **épica**.
- **Prioridad:** Alta = indispensable para el lanzamiento · Media = importante · Baja = deseable.
- Los criterios de aceptación se escriben como condiciones observables en la interfaz o en la API.

### 1.3 Mapa de épicas

| Épica | Nombre | Historias |
|---|---|---|
| E1 | Autenticación y cuentas | HU-01 a HU-08 |
| E2 | Catálogo de servicios | HU-09 a HU-13 |
| E3 | Barberos y horarios | HU-14 a HU-19 |
| E4 | Reservas de citas | HU-20 a HU-28 |
| E5 | Gestión de citas | HU-29 a HU-33 |
| E6 | Reseñas y valoraciones | HU-34 a HU-36 |
| E7 | Reportes y administración | HU-37 a HU-40 |
| E8 | Experiencia de usuario y plataforma | HU-41 a HU-45 |
| E9 | Pagos: Yape, Plin y efectivo (PEN) | HU-46 a HU-55 |

---

## Épica E1 — Autenticación y cuentas

### HU-01 — Registro de cliente
**Como** visitante **quiero** registrarme con mi nombre, email, teléfono y contraseña **para** crear una cuenta y poder reservar citas.
- El formulario valida que el email tenga formato correcto y la contraseña al menos 6 caracteres.
- Si el email ya existe, el sistema muestra el mensaje "El email ya está registrado" sin crear duplicados.
- Tras el registro exitoso, la cuenta se crea con rol `cliente` y la sesión se inicia automáticamente.

**Prioridad:** Alta

### HU-02 — Inicio de sesión
**Como** usuario registrado (cliente, barbero o admin) **quiero** iniciar sesión con email y contraseña **para** acceder a las funcionalidades de mi rol.
- Si las credenciales son correctas, la API responde con un token JWT y los datos del usuario.
- Si el email no existe o la contraseña no coincide, se muestra "Credenciales inválidas" con código 401.
- El token se guarda en el navegador y se envía en el encabezado `Authorization: Bearer` en cada petición.

**Prioridad:** Alta

### HU-03 — Cierre de sesión
**Como** usuario con sesión activa **quiero** cerrar sesión **para** abandonar mi cuenta en dispositivos compartidos.
- El botón "Salir" del menú limpia el token y los datos locales del navegador.
- Al cerrar sesión se redirige a la pantalla de login.
- Las rutas privadas dejan de ser accesibles hasta volver a iniciar sesión.

**Prioridad:** Alta

### HU-04 — Validación de credenciales con retroalimentación
**Como** usuario **quiero** ver mensajes claros cuando un formulario de acceso falla **para** corregir mis datos sin confusión.
- Campos vacíos muestran errores de validación antes de enviar la petición.
- Errores del servidor (401, 409, 500) se muestran como notificación toast con el mensaje exacto de la API.
- Ningún mensaje revela si falló el email o la contraseña (evita enumeración de usuarios).

**Prioridad:** Media

### HU-05 — Persistencia de sesión
**Como** usuario **quiero** que mi sesión persista al recargar la página **para** no iniciar sesión constantemente.
- El token y el perfil se almacenan en `localStorage` y se restauran al abrir la app.
- Si el token es inválido o expiró, la aplicación redirige al login automáticamente.
- El token JWT tiene una vigencia de 7 días.

**Prioridad:** Media

### HU-06 — Consultar perfil propio
**Como** usuario autenticado **quiero** consultar mis datos (nombre, email, teléfono, rol) **para** verificar la información de mi cuenta.
- El endpoint `GET /api/perfil` devuelve los datos del usuario dueño del token.
- La pantalla de perfil muestra los datos actuales y el rol con una insignia visual.
- Si el token no es válido la API responde 401 y la UI redirige al login.

**Prioridad:** Media

### HU-07 — Editar perfil propio
**Como** usuario autenticado **quiero** actualizar mi nombre y teléfono **para** mantener mi información al día.
- El endpoint `PUT /api/perfil` acepta `nombre` y `telefono` y devuelve el registro actualizado.
- El email no puede modificarse desde esta pantalla (evita romper la identidad de la cuenta).
- Tras guardar, el menú de navegación refleja el nuevo nombre inmediatamente.

**Prioridad:** Media

### HU-08 — Restricción de acceso por rol
**Como** administrador del sistema **quiero** que cada usuario solo acceda a las pantallas de su rol **para** proteger la información y las operaciones.
- Las páginas de administración solo son accesibles con rol `admin`; si no, se redirige al inicio.
- La vista del barbero solo lista las citas asignadas a ese barbero.
- La API valida el rol en el servidor (403 "Requiere rol administrador"), no solo en la interfaz.

**Prioridad:** Alta

---

## Épica E2 — Catálogo de servicios

### HU-09 — Ver catálogo de servicios
**Como** visitante o cliente **quiero** ver la lista de servicios con nombre, descripción, precio y duración **para** decidir qué reservar.
- El endpoint `GET /api/servicios` es público y devuelve solo servicios con `activo = true`.
- Cada servicio se presenta en una tarjeta con precio formateado en soles peruanos (PEN).
- La duración se muestra en minutos junto al servicio.

**Prioridad:** Alta

### HU-10 — Ver detalle del servicio al reservar
**Como** cliente **quiero** ver el precio y la duración del servicio seleccionado durante la reserva **para** saber qué pagaré y cuánto tardará.
- Al elegir un servicio en el asistente de reserva, el resumen lateral muestra precio y duración.
- El precio y la duración provienen de la base de datos, no están escritos a mano en la UI.
- Si no hay servicios activos, el asistente muestra un mensaje y deshabilita avanzar.

**Prioridad:** Media

### HU-11 — Crear servicio
**Como** administrador **quiero** registrar un nuevo servicio (nombre, descripción, precio, duración) **para** ofrecerlo en el catálogo.
- Solo el rol `admin` puede crear servicios (la API responde 403 a otros roles).
- El precio debe ser un número mayor o igual a 0 y la duración un entero positivo.
- El servicio creado aparece inmediatamente en el catálogo público.

**Prioridad:** Alta

### HU-12 — Editar servicio
**Como** administrador **quiero** modificar los datos de un servicio existente **para** corregir precios o descripciones.
- El formulario de edición se abre precargado con los valores actuales.
- Al guardar, los cambios se reflejan en el catálogo sin recargar la página.
- La API valida los mismos tipos y rangos que en la creación.

**Prioridad:** Media

### HU-13 — Desactivar / eliminar servicio
**Como** administrador **quiero** quitar un servicio del catálogo **para** dejar de ofrecerlo sin romper el historial de citas.
- La acción de eliminar realiza un borrado lógico (`activo = false`), conservando las citas pasadas.
- El sistema pide confirmación antes de ejecutar la eliminación.
- Los servicios inactivos dejan de aparecer en el catálogo público y en el asistente de reserva.

**Prioridad:** Alta

---

## Épica E3 — Barberos y horarios

### HU-14 — Ver lista de barberos
**Como** visitante o cliente **quiero** ver el equipo de barberos con su especialidad **para** elegir con quién atenderme.
- El endpoint `GET /api/barberos` es público y devuelve solo barberos `activo = true`.
- Cada tarjeta muestra nombre, especialidad y la cantidad de reseñas recibidas.
- La lista incluye los horarios de atención semanal de cada barbero.

**Prioridad:** Alta

### HU-15 — Conocer la especialidad de cada barbero
**Como** cliente **quiero** filtrar mentalmente por especialidad (corte clásico, barba, diseños) **para** elegir al barbero adecuado.
- La especialidad se almacena por barbero y se muestra como etiqueta visible.
- Si un barbero no tiene especialidad definida, la tarjeta lo indica con un texto neutro.
- El administrador puede definir o cambiar la especialidad al crear/editar el barbero.

**Prioridad:** Media

### HU-16 — Registrar barbero
**Como** administrador **quiero** agregar un barbero con nombre y especialidad **para** ampliar el equipo.
- Solo el rol `admin` puede crear barberos.
- El nuevo barbero aparece de inmediato en la lista pública y en el asistente de reservas.
- El nombre es obligatorio; la especialidad es opcional.

**Prioridad:** Alta

### HU-17 — Editar barbero
**Como** administrador **quiero** corregir el nombre o la especialidad de un barbero **para** mantener el equipo actualizado.
- El formulario se abre precargado con los datos actuales.
- Los cambios se ven reflejados al instante en la lista de administración.
- La API valida que el barbero exista (404 si no).

**Prioridad:** Media

### HU-18 — Definir y editar horarios de atención
**Como** administrador **quiero** establecer los días y rangos de horas en que atiende cada barbero **para** que el sistema calcule la disponibilidad real.
- Por cada día de la semana se puede activar el día y definir hora de inicio y hora de fin.
- Se permiten dos rangos por día (ej. 09:00–13:00 y 14:00–19:00) para el descanso del almuerzo.
- Al guardar, los horarios anteriores del barbero se reemplazan por los nuevos.

**Prioridad:** Alta

### HU-19 — Desactivar barbero
**Como** administrador **quiero** desactivar un barbero que ya no trabaja **para** que no reciba nuevas reservas sin perder su historial.
- La eliminación es lógica (`activo = false`); sus citas históricas se conservan.
- El barbero desactivado desaparece del catálogo público y del asistente de reservas.
- El sistema pide confirmación antes de desactivar.

**Prioridad:** Media

---

## Épica E4 — Reservas de citas

### HU-20 — Seleccionar servicio para reservar
**Como** cliente autenticado **quiero** iniciar una reserva eligiendo un servicio del catálogo **para** especificar qué necesito.
- El paso 1 del asistente muestra las tarjetas de servicios activos y resalta el seleccionado.
- Solo se puede avanzar al paso 2 cuando hay un servicio seleccionado.
- El resumen lateral muestra nombre, precio y duración del servicio elegido.

**Prioridad:** Alta

### HU-21 — Seleccionar barbero
**Como** cliente **quiero** elegir el barbero que me atenderá **para** reservar con mi profesional de preferencia.
- El paso 2 muestra las tarjetas de barberos activos con su especialidad.
- El barbero seleccionado queda resaltado y se muestra en el resumen.
- El botón "Continuar" permanece deshabilitado hasta seleccionar uno.

**Prioridad:** Alta

### HU-22 — Ver disponibilidad por fecha
**Como** cliente **quiero** elegir una fecha y ver solo las horas realmente disponibles **para** no intentar reservar horas ocupadas.
- El endpoint `GET /api/disponibilidad?barbero_id&fecha` genera los turnos según el horario semanal del barbero para ese día.
- Las horas que ya tienen una cita (no cancelada) se excluyen de la respuesta.
- Si el barbero no atiende ese día, se muestra "El barbero no atiende este día" y ninguna hora.

**Prioridad:** Alta

### HU-23 — Seleccionar hora disponible
**Como** cliente **quiero** escoger una de las horas disponibles presentadas como opciones **para** fijar mi cita.
- Las horas se muestran como botones tipo "chips"; solo se puede seleccionar una.
- No se ofertan horas pasadas si la fecha elegida es hoy.
- La hora seleccionada aparece en el resumen antes de confirmar.

**Prioridad:** Alta

### HU-24 — Confirmar reserva con notas
**Como** cliente **quiero** confirmar la reserva y agregar notas opcionales (ej. "con máquina 1") **para** dar contexto al barbero.
- El botón "Confirmar reserva" envía `POST /api/citas` con servicio, barbero, fecha, hora y notas.
- La cita se crea con estado inicial `pendiente`.
- Tras confirmar, se muestra una notificación de éxito y se redirige a "Mis Citas".

**Prioridad:** Alta

### HU-25 — Recibir confirmación visual de la reserva
**Como** cliente **quiero** ver un mensaje claro de que mi cita quedó registrada **para** estar tranquilo de que el proceso terminó.
- La API responde 201 con la cita creada incluyendo nombres de barbero y servicio.
- La UI muestra un toast "Reserva creada con éxito" al confirmar.
- La nueva cita aparece al inicio de la lista "Mis Citas" con su insignia de estado.

**Prioridad:** Media

### HU-26 — Ver mis reservas
**Como** cliente **quiero** listar mis citas con servicio, barbero, fecha, hora y estado **para** llevar control de mis reservas.
- `GET /api/citas` con rol cliente devuelve únicamente las citas del usuario del token.
- Cada tarjeta muestra el estado con un color: pendiente (ámbar), confirmada (azul→neutro), completada (verde), cancelada (rojo).
- Las citas están ordenadas de la más reciente a la más antigua.

**Prioridad:** Alta

### HU-27 — Cancelar mi reserva
**Como** cliente **quiero** cancelar una cita pendiente o confirmada **para** liberar el horario si ya no puedo asistir.
- El botón "Cancelar" pide confirmación y ejecuta `DELETE /api/citas/:id`.
- La cancelación cambia el estado a `cancelada` (no borra el registro).
- Un cliente no puede cancelar citas de otro cliente (la API valida la propiedad).

**Prioridad:** Alta

### HU-28 — Evitar reservas duplicadas (anti-solapamiento)
**Como** sistema **quiero** impedir que dos citas ocupen el mismo barbero, fecha y hora **para** que la agenda sea consistente.
- Al confirmar, la API verifica si ya existe una cita no cancelada en ese slot (409 si está ocupado).
- La verificación ocurre en el servidor, no solo en la UI, para evitar condiciones de carrera visibles.
- Los slots liberados por una cancelación vuelven a estar disponibles.

**Prioridad:** Alta

---

## Épica E5 — Gestión de citas

### HU-29 — Ver todas las citas (admin)
**Como** administrador **quiero** listar todas las citas del sistema con cliente, barbero, servicio y precio **para** supervisar la operación completa.
- `GET /api/citas` con rol `admin` devuelve todas las citas con los datos relacionados incrustados.
- La tabla muestra fecha, hora, cliente, barbero, servicio, precio y estado.
- La lista se ordena por fecha y hora.

**Prioridad:** Alta

### HU-30 — Filtrar citas por estado (admin)
**Como** administrador **quiero** filtrar la tabla de citas por estado **para** encontrar rápidamente las que requieren atención.
- Un selector permite mostrar: todas, pendientes, confirmadas, completadas o canceladas.
- El filtro se aplica en el cliente sobre la lista cargada (respuesta inmediata).
- El contador de resultados refleja el filtro activo.

**Prioridad:** Media

### HU-31 — Cambiar el estado de una cita (admin)
**Como** administrador **quiero** actualizar el estado de cualquier cita **para** reflejar confirmaciones, atenciones y cancelaciones.
- `PATCH /api/citas/:id/estado` acepta uno de los cuatro estados válidos y rechaza otros (422).
- El selector de estado en la tabla actualiza la cita al instante y muestra un toast de éxito.
- Los estados válidos son: `pendiente`, `confirmada`, `completada`, `cancelada`.

**Prioridad:** Alta

### HU-32 — Ver citas asignadas al barbero
**Como** barbero **quiero** ver las citas que me fueron asignadas, agrupadas por día **para** organizar mi jornada.
- `GET /api/citas` con rol barbero filtra por `barbero_id` vinculado a la cuenta del usuario.
- Las citas se agrupan por fecha con un encabezado por día.
- Cada tarjeta muestra cliente, servicio, hora y estado.

**Prioridad:** Alta

### HU-33 — Actualizar el estado desde la vista del barbero
**Como** barbero **quiero** confirmar o completar mis citas con un clic **para** mantener la agenda al día mientras atiendo.
- Botones contextuales: "Confirmar" (si está pendiente), "Completar" (si está confirmada), "Cancelar".
- Cada acción ejecuta `PATCH /api/citas/:id/estado` y refresca la lista.
- El barbero solo puede modificar citas propias (la API lo valida).

**Prioridad:** Alta

---

## Épica E6 — Reseñas y valoraciones

### HU-34 — Dejar reseña tras cita completada
**Como** cliente **quiero** valorar de 1 a 5 estrellas y comentar la atención **para** compartir mi experiencia.
- El botón "Valorar" solo aparece en citas con estado `completada` que aún no tienen reseña.
- `POST /api/resenas` valida que la cita pertenezca al cliente, esté completada y no tenga reseña previa (409 si ya existe).
- La base de datos garantiza una única reseña por cita (restricción única sobre `cita_id`).

**Prioridad:** Media

### HU-35 — Ver reseñas de cada barbero
**Como** visitante o cliente **quiero** leer las reseñas con el nombre del cliente, la calificación y el comentario **para** decidir con quién reservar.
- `GET /api/resenas?barbero_id=` es público y devuelve las reseñas más recientes.
- La página de inicio muestra un bloque con las últimas reseñas del equipo.
- Cada reseña muestra las estrellas y el comentario.

**Prioridad:** Media

### HU-36 — Calificación visible en la tarjeta del barbero
**Como** cliente **quiero** ver cuántas reseñas tiene cada barbero **para** medir su reputación de un vistazo.
- La tarjeta del barbero muestra la cantidad de reseñas recibidas.
- Las reseñas se relacionan con el barbero y el cliente que las escribió.
- Los barberos sin reseñas muestran "Sin reseñas aún".

**Prioridad:** Baja

---

## Épica E7 — Reportes y administración

### HU-37 — Ver KPIs del dashboard (admin)
**Como** administrador **quiero** un panel con indicadores clave **para** tomar decisiones sobre la operación.
- El dashboard muestra: citas de hoy, citas pendientes, clientes registrados e ingresos del mes.
- Los KPIs se calculan en el servidor en `GET /api/dashboard`.
- Cada KPI se presenta en una tarjeta con su icono distintivo.

**Prioridad:** Alta

### HU-38 — Conocer los ingresos del mes
**Como** administrador **quiero** ver la suma de los precios de las citas completadas del mes en curso **para** medir el rendimiento económico.
- El cálculo suma `servicios.precio` de citas con estado `completada` cuya fecha sea del mes actual.
- El monto se formatea en soles peruanos (PEN), ej. "S/ 30.00".
- Si no hay citas completadas, se muestra S/ 0.00 sin errores.

**Prioridad:** Media

### HU-39 — Ver las próximas citas del día (admin)
**Como** administrador **quiero** un listado de las citas programadas para hoy **para** preparar la jornada.
- El dashboard lista las citas de hoy ordenadas por hora con cliente, barbero y servicio.
- Incluye una barra de distribución de citas por estado.
- Si no hay citas hoy, muestra un mensaje neutro.

**Prioridad:** Media

### HU-40 — Documentación automática de la API
**Como** desarrollador o evaluador **quiero** una documentación interactiva de los endpoints **para** probar y entender la API sin leer el código.
- La API expone documentación OpenAPI generada automáticamente por el plugin `@elysiajs/openapi`.
- La documentación es accesible en `/openapi` con el backend en ejecución.
- Cada endpoint documenta sus parámetros y esquemas de validación.

**Prioridad:** Baja

---

## Épica E8 — Experiencia de usuario y plataforma

### HU-41 — Página de inicio con catálogo y equipo
**Como** visitante **quiero** una portada atractiva con el catálogo de servicios, el equipo de barberos y las reseñas **para** confiar en la barbería y motivarme a reservar.
- La página de inicio muestra un hero con slider de imágenes a la derecha y llamado a la acción "Reservar cita".
- Incluye secciones de servicios (tarjetas con precio en soles) y barberos.
- Si el visitante no tiene sesión, los botones principales lo llevan a login/registro.

**Prioridad:** Media

### HU-42 — Interfaz responsive
**Como** usuario móvil **quiero** que el sistema se use cómodamente desde el teléfono **para** reservar desde cualquier lugar.
- Las rejillas de tarjetas colapsan a una columna en pantallas pequeñas.
- El menú de navegación se adapta y mantiene objetivos táctiles ≥ 44 px.
- Los formularios y tablas son legibles sin desplazamiento horizontal en 360 px de ancho.

**Prioridad:** Media

### HU-43 — Notificaciones de acciones
**Como** usuario **quiero** recibir confirmaciones o errores de cada acción mediante toasts **para** saber siempre el resultado de lo que hago.
- Acciones exitosas (reservar, cancelar, guardar, valorar) muestran un toast verde de éxito.
- Los errores de la API se muestran con el mensaje exacto devuelto por el servidor.
- Los toasts desaparecen solos tras unos segundos y no bloquean la interfaz.

**Prioridad:** Media

### HU-44 — Estados visuales consistentes
**Como** usuario **quiero** reconocer el estado de cada cita por color e insignia **para** interpretar la agenda de un vistazo.
- Insignias: pendiente (ámbar), confirmada (índigo neutro), completada (verde), cancelada (rojo).
- El mismo componente de insignia se usa en todas las vistas (cliente, barbero, admin).
- Los botones de acción se deshabilitan cuando el estado no lo permite.

**Prioridad:** Media

### HU-45 — Endpoint de salud y arranque verificado
**Como** desarrollador **quiero** un endpoint `GET /api/salud` **para** comprobar rápidamente que la API está viva y configurada.
- El endpoint responde `{ ok: true }` con un mensaje de estado.
- El backend imprime en consola las URLs de la API y de la documentación al arrancar.
- Si faltan variables de entorno (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`), el sistema lo advierte con un mensaje claro en consola.

**Prioridad:** Baja

---

## Épica E9 — Pagos: Yape, Plin y efectivo (PEN)

### HU-46 — Pagar una cita con Yape
**Como** cliente **quiero** pagar mi cita con Yape registrando el código de operación que me muestra la app **para** confirmar mi reserva al instante desde mi celular.
- La pantalla de pago muestra el número Yape de la barbería y el monto exacto en soles antes de cobrar.
- El campo acepta un código de operación de seis dígitos; cualquier otro formato se rechaza con un mensaje claro.
- Tras registrar el código, el pago queda aprobado, la cita pasa a estado `confirmada` y se emite el comprobante de pago (COMP-XXXXXX).
- Si el código ya fue usado en otro pago, el sistema lo rechaza con 409 y explica la razón (anti doble cobro).

**Prioridad:** Alta

### HU-47 — Pagar una cita con Plin
**Como** cliente **quiero** pagar con Plin desde mi celular +51 **para** confirmar la reserva sin efectivo ni tarjeta.
- Se pide el celular Plin del pagador (+51 seguido de 9 dígitos que empiecen con 9) y el código de operación de la app.
- El pago aprobado confirma la cita y emite el comprobante con la referencia de la transacción.
- Un celular mal formado o un código duplicado impiden completar el pago sin cobrar.

**Prioridad:** Alta

### HU-48 — Reservar y pagar en efectivo en caja
**Como** cliente **quiero** reservar sin pagar en línea **para** cancelar en efectivo en la caja de la barbería.
- Al elegir "Efectivo", el pago queda con estado `pendiente_caja` y la cita sigue sin marcar como pagada.
- El sistema indica que el comprobante se emite cuando la caja recibe el dinero.
- La cita se confirma automáticamente cuando el administrador confirma el cobro en caja.

**Prioridad:** Alta

### HU-49 — Monto fijado por el servidor en soles (PEN)
**Como** administrador **quiero** que el monto cobrado lo calcule siempre el servidor **para** evitar manipulaciones de precio desde el cliente.
- El backend toma el precio del servicio asignado a la cita y lo cobra en PEN; el cliente no envía ningún monto.
- Todos los montos se muestran formateados como "S/ 25.00".
- Una cita sin precio válido no puede cobrarse.

**Prioridad:** Alta

### HU-50 — Comprobante de pago con numeración automática
**Como** cliente **quiero** recibir un comprobante de pago numerado **para** tener constancia formal de mi transacción.
- Cada pago aprobado genera un comprobante con número secuencial COMP-000001, COMP-000002, …
- El comprobante incluye: barbería, número, fecha de emisión, cliente, servicio, barbero, fecha y hora de la cita, método, código de operación (si aplica), referencia de la pasarela y total en soles.
- El número de comprobante es único en todo el sistema y no puede repetirse.

**Prioridad:** Alta

### HU-51 — Ver mi comprobante desde Mis citas
**Como** cliente **quiero** consultar el comprobante de una cita pagada **para** revisarlo o imprimirlo cuando lo necesite.
- Las citas con pago aprobado muestran el botón "Ver comprobante".
- El comprobante se presenta en una ventana con diseño de recibo y puede imprimirse desde el navegador.
- Una cita sin pago aprobado no muestra comprobante.

**Prioridad:** Media

### HU-52 — Protección anti doble cobro por cita
**Como** cliente **quiero** que el sistema impida que mi cita se cobre dos veces **para** no perder dinero por errores o reenvíos.
- Si la cita ya tiene un pago aprobado, cualquier nuevo intento se rechaza con estado HTTP 409 sin registrar un cobro.
- La base de datos garantiza la regla con un índice único parcial incluso si dos solicitudes llegan a la vez.
- Una cita solo puede tener un comprobante asociado.

**Prioridad:** Alta

### HU-53 — Protección anti doble uso del código de operación
**Como** administrador **quiero** que cada código de operación Yape/Plin se acepte una sola vez **para** impedir que un mismo pago de la app cubra varias citas.
- Antes de aprobar, se busca el código entre los pagos aprobados; si ya existe, se rechaza con 409.
- Los intentos rechazados quedan registrados para auditoría sin bloquear el código: puede reintentarse con el dato correcto.
- En modo Supabase la regla se respalda con un índice único parcial; en modo demo la aplica la lógica del servidor.

**Prioridad:** Alta

### HU-54 — Confirmar cobro en efectivo desde caja (admin)
**Como** administrador **quiero** confirmar los pagos en efectivo recibidos en caja **para** que la cita quede pagada y emitir su comprobante.
- El panel de pagos lista los pagos con estado "Pendiente en caja" y el botón "Confirmar caja".
- Al confirmar, el pago pasa a `aprobado`, la cita se confirma y se emite el comprobante COMP-XXXXXX.
- Un pago ya confirmado no puede volver a confirmarse (anti doble cobro) y solo el rol administrador puede hacerlo.

**Prioridad:** Alta

### HU-55 — Administración de pagos del negocio
**Como** administrador **quiero** ver todos los pagos con su comprobante, método, código de operación, estado y monto **para** conciliar la caja diaria.
- La página "Pagos" (solo admin) lista fecha, cliente, servicio, método con su código de operación, comprobante, referencia, estado y monto en soles.
- La cabecera resume el total recaudado, la cantidad de pagos aprobados y los efectivos pendientes en caja.
- Un cliente autenticado no puede acceder al listado completo (403).

**Prioridad:** Media

---

## Matriz de trazabilidad resumida

| Épica | Módulos que la implementan |
|---|---|
| E1 Autenticación | `backend/src/routes/auth.ts`, `usuarios.ts`, `lib/auth.ts` · `frontend/src/pages/Login.tsx`, `Registro.tsx`, `context/AuthContext.tsx` |
| E2 Servicios | `backend/src/routes/servicios.ts` · `frontend/src/pages/admin/AdminServicios.tsx`, `pages/Inicio.tsx`, `pages/Reservar.tsx` |
| E3 Barberos y horarios | `backend/src/routes/barberos.ts` · `frontend/src/pages/admin/AdminBarberos.tsx` |
| E4 Reservas | `backend/src/routes/citas.ts` (disponibilidad + crear + cancelar) · `frontend/src/pages/Reservar.tsx`, `MisCitas.tsx` |
| E5 Gestión de citas | `backend/src/routes/citas.ts` (listar + estado) · `frontend/src/pages/CitasBarbero.tsx`, `pages/admin/AdminCitas.tsx` |
| E6 Reseñas | `backend/src/routes/resenas.ts` · `frontend/src/pages/MisCitas.tsx`, `Inicio.tsx` |
| E7 Reportes | `backend/src/routes/dashboard.ts` + `@elysiajs/openapi` · `frontend/src/pages/admin/Dashboard.tsx` |
| E8 Experiencia | `frontend/src/components/Layout.tsx`, `Slider.tsx`, `index.css`, `sonner`, `EstadoBadge.tsx` · `backend/src/index.ts` (`/api/salud`) |
| E9 Pagos | `backend/src/routes/pagos.ts`, `lib/pasarela.ts` · `frontend/src/components/PagoForm.tsx`, `components/Comprobante.tsx`, `pages/Reservar.tsx`, `pages/MisCitas.tsx`, `pages/admin/PagosAdmin.tsx` |
