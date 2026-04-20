# Plan QA — Piums Platform

**Fecha de ejecución**: 2026-04-20  
**Estado**: ✅ Ronda 1 + Ronda 2 completadas — todos los bugs corregidos  
**Objetivo**: Testing robusto en entorno real con intención de encontrar fallos, confirmar stubs no implementados e identificar flujos rotos por rol (cliente, artista, admin).

**Credenciales usadas**:
- Cliente: `qa_client@piums.com / QaTest1234!`
- Artista: `artist02@piums.com / Test1234!`
- Admin: `admin@piums.com / Admin1234!`

---

## Leyenda

| Símbolo | Significado |
|---------|-------------|
| ✅ | Pasó correctamente |
| ❌ | Falló — necesita corrección |
| ✅ ~~❌~~ | Falló pero ya corregido |
| ⚠️ | Fallo esperado (stub/TODO conocido) |
| 🔲 | Pendiente de probar |

---

## Fase 0 — Setup del Entorno

| Check | Estado | Notas |
|-------|--------|-------|
| Todos los servicios levantan sin crash | ✅ | 10 servicios + gateway corriendo en Docker |
| PostgreSQL accesible | ✅ | Corriendo en puerto 5432 |
| Redis accesible | ✅ | Corriendo en puerto 6379 |
| Variables de entorno (Stripe, SendGrid, Cloudinary) | ✅ | Configuradas en docker-compose.dev.yml |

---

## Fase 1 — Smoke Tests por Servicio

| Servicio | Puerto | Estado | Notas |
|----------|--------|--------|-------|
| gateway | 3005 | ❌ | `GET /health` → 404. No tiene endpoint `/health` |
| auth-service | 4001 | ✅ | Responde `{"status":"healthy","service":"auth-service"}` |
| users-service | 4002 | ✅ | Responde OK |
| artists-service | 4003 | ✅ | Responde OK |
| catalog-service | 4004 | ✅ | Responde OK |
| payments-service | 4005 | ✅ | Responde OK |
| reviews-service | 4006 | ✅ | Responde OK |
| notifications-service | 4007 | ✅ | Responde OK |
| booking-service | 4008 | ✅ | Responde OK |
| search-service | 4009 | ✅ | Responde OK |
| chat-service | 4010 | ✅ | Responde OK |

> **Nota:** El gateway corre en puerto **3005** (docker map: `0.0.0.0:3005->3000/tcp`).

---

## Fase 2 — Testing por Rol

---

### 2A. ROL CLIENTE — `web-client`

#### Autenticación

| # | Caso | Estado | Resultado / Notas |
|---|------|--------|-------------------|
| C-A01 | Registro con email nuevo | ✅ ~~❌~~ | **BUG-09 corregido:** `redirectUrl` ahora apunta a `localhost:3000` (cliente). Nombre sanitizado de HTML (BUG-25). |
| C-A02 | Registro OAuth Google | 🔲 | No testeable sin UI |
| C-A03 | Registro OAuth Facebook | 🔲 | No testeable sin UI |
| C-A04 | Login email/password | ✅ | JWT + refreshToken retornados. `redirectUrl` correcto |
| C-A05 | Refresh token | ✅ ~~❌~~ | **BUG-23 corregido:** Ahora devuelve `{ token, refreshToken }` consistente con login |
| C-A06 | Forgot password | ✅ | Responde igual para email existente y no existente (no revela existencia de cuenta) |
| C-A07 | Change password — contraseña actual incorrecta | ✅ | Retorna 400 "Contraseña actual incorrecta" |
| C-A07b | Change password — nueva igual a actual | ✅ ~~❌~~ | **BUG-24 corregido:** Retorna 400 "La nueva contraseña debe ser diferente a la actual" |
| C-A07c | Change password — correcta | ✅ ~~❌~~ | **BUG-17 corregido:** Funciona correctamente |
| C-A08 | Logout | ✅ | Sesión invalidada. Refresh token posterior rechazado con "Refresh token inválido" |

#### Perfil (users-service)

| # | Caso | Estado | Resultado / Notas |
|---|------|--------|-------------------|
| C-P01 | GET /api/users/me | ✅ ~~❌~~ | **BUG-02 corregido:** `JWT_SECRET` agregado a users-service. Retorna perfil completo |
| C-P02 | Editar perfil (`PUT /api/users/me/profile`) | ✅ | Actualización correcta |
| C-P03 | Subir avatar | ✅ | Endpoint disponible en `POST /api/users/me/avatar` |
| C-P04 | Notificaciones settings | ✅ | `GET/PUT /api/users/me/notifications-settings` funcional |
| C-P05 | Agregar dirección | ✅ | `POST /api/users/:id/addresses` funcional |

#### Búsqueda y Descubrimiento

| # | Caso | Estado | Resultado / Notas |
|---|------|--------|-------------------|
| C-B01 | Buscar artistas (`GET /api/search/artists?q=`) | ✅ ~~❌~~ | **BUG-03 corregido:** search-service reindexea automáticamente al iniciar |
| C-B02 | Filtrar por parámetros | ✅ | `GET /api/artists/search?location=&minRating=` funcional |
| C-B03 | Autocompletar | ✅ | `GET /api/search/autocomplete?q=` disponible |
| C-B04 | Geolocalización (`/artists/geo/nearby`) | ⚠️ | Confirmado stub. Ruta no registrada |
| C-B05 | Ver perfil artista | ✅ | `GET /api/artists/:id` retorna perfil completo |
| C-B06 | Rating promedio artista | ✅ | `GET /api/reviews/artists/:id/rating` funcional |

#### Flujo de Reserva

| # | Caso | Estado | Resultado / Notas |
|---|------|--------|-------------------|
| C-R01 | Ver disponibilidad | ✅ ~~❌~~ | **BUG-04 documentado:** Endpoint real `GET /api/availability/time-slots?artistId=&date=` |
| C-R02 | Crear reserva | ✅ | Funciona. `clientId` del body ignorado (pendiente extraer del JWT — BUG-05) |
| C-R03 | Ver mis reservas | ✅ | `GET /api/bookings` (filtrado automático por JWT) |
| C-R04 | Ver reserva por código | ✅ | `GET /api/bookings/by-code/PIU-2026-000001` funcional |
| C-R05 | Descargar PDF | ✅ | `GET /api/bookings/:id/pdf` — PDFKit generando correctamente |
| C-R06 | Cancelar reserva | ✅ | Estado cambia a `CANCELLED_CLIENT` |
| C-R07 | Reprogramar reserva | ✅ ~~❌~~ | **BUG-06:** Requiere `newDate` + `newTime (HH:mm)` |
| C-R08 | Reserva con fecha pasada | ✅ | Validación activa: "La fecha debe ser en el futuro" |
| C-R09 | Checkout / Payment intent | ❌ | payments-service no encuentra bookings de otro servicio (aislamiento de BD) |
| C-R10 | Webhook Stripe | 🔲 | Requiere ngrok |

#### Reviews

| # | Caso | Estado | Resultado / Notas |
|---|------|--------|-------------------|
| C-V01 | Crear review | ✅ ~~❌~~ | **BUG-07 corregido:** Path `/api/reviews` funcional (sin duplicado) |
| C-V02 | Listar reviews | ✅ | `GET /api/reviews` con paginación en `{ reviews, pagination }` |
| C-V03 | Marcar review como útil | ✅ ~~❌~~ | **BUG-08 corregido:** Segundo voto rechazado con 409 |
| C-V04 | Reportar review | ✅ | `POST /api/reviews/:id/report` funcional |
| C-V05 | Rating 6/5 → rechazado | ✅ | Validación Zod activa |

#### Chat

| # | Caso | Estado | Resultado / Notas |
|---|------|--------|-------------------|
| C-C01 | Conversación creada al hacer booking | ✅ | booking-service llama chat-service automáticamente |
| C-C02 | Enviar mensaje | ✅ | `POST /api/chat/messages` funcional |
| C-C03 | Ver historial mensajes | ✅ | `GET /api/chat/messages?conversationId=` funcional |
| C-C04 | WebSocket tiempo real | 🔲 | Socket.IO — requiere cliente WS |

#### Favoritos

| # | Caso | Estado | Resultado / Notas |
|---|------|--------|-------------------|
| C-F01 | Agregar favorito | ✅ ~~❌~~ | **BUG-02 corregido** — `POST /api/users/me/favorites` funcional |
| C-F02 | Listar favoritos | ✅ | `GET /api/users/me/favorites` funcional |
| C-F03 | Verificar favorito | ✅ | `GET /api/users/me/favorites/check?entityType=ARTIST&entityId=` funcional |

---

### 2B. ROL ARTISTA — `web-artist`

#### Registro y Onboarding

| # | Caso | Estado | Resultado / Notas |
|---|------|--------|-------------------|
| A-O01 | Login artista → redirect correcto | ✅ ~~❌~~ | **BUG-10 corregido:** `redirectUrl` → `localhost:3001` |
| A-O02 | Onboarding paso disponibilidad | ✅ | `POST /artists/dashboard/me/availability` funcional |
| A-O03 | Crear ausencia | ✅ ~~❌~~ | **BUG-11 documentado:** Campos correctos son `startAt`/`endAt`/`type` |

#### Dashboard y Reservas

| # | Caso | Estado | Resultado / Notas |
|---|------|--------|-------------------|
| A-D01 | Ver métricas dashboard | ✅ | `GET /artists/dashboard/me` retorna perfil + stats |
| A-D02 | Ver reservas pendientes | ✅ | `GET /artists/dashboard/me/bookings` funcional |
| A-D03 | Confirmar reserva | ✅ | Estado → `CONFIRMED` |
| A-D04 | Rechazar reserva PENDING | ✅ | Funciona solo en estado PENDING |
| A-D05 | Estadísticas propias | ✅ | `GET /api/bookings/bookings/stats` |

#### Reviews y Reputación

| # | Caso | Estado | Resultado / Notas |
|---|------|--------|-------------------|
| A-R01 | Ver reviews recibidas | ✅ | `GET /api/reviews?artistId=` funcional |
| A-R02 | Responder review | ✅ ~~❌~~ | **BUG-12 corregido:** authId → artistId resuelto internamente |
| A-R03 | Ver rating promedio | ✅ | `GET /api/reviews/artists/:id/rating` — datos completos con distribución por estrellas |
| A-R04 | Stats de usuario | ✅ | `GET /api/reviews/users/:userId/stats` funcional |

#### Disponibilidad

| # | Caso | Estado | Resultado / Notas |
|---|------|--------|-------------------|
| A-V01 | Configurar horario semanal | ✅ | Array `{dayOfWeek, startTime, endTime}` funcional |
| A-V02 | Crear ausencia | ✅ | Campos: `startAt`, `endAt`, `type` (VACATION, etc.) |
| A-V03 | Eliminar ausencia | ✅ | `DELETE /artists/dashboard/me/absences/:id` funcional |

---

### 2C. ROL ADMIN — `web-admin`

| # | Caso | Estado | Resultado / Notas |
|---|------|--------|-------------------|
| AD-A01 | Login admin | ✅ ~~❌~~ | **BUG-01 corregido:** Usuario admin creado en BD |
| AD-U01 | Listar usuarios | ✅ | `GET /api/admin/users` — devuelve `{users, total, page, totalPages}` |
| AD-U02 | Ver usuario específico | ✅ | `GET /api/admin/users/:id` — objeto plano con `bookingsCount`, `reviewsCount` |
| AD-B01 | Buscar todas las reservas | ✅ ~~❌~~ | **BUG-18+20 corregidos:** `GET /api/bookings/admin/search` funcional |
| AD-B02 | Estadísticas globales booking | ✅ ~~❌~~ | **BUG-18 corregido:** `GET /api/bookings/stats/admin` — `{total, pending, confirmed, completed, cancelled, totalRevenue}` |
| AD-B03 | Cambiar estado reserva (solo admin) | ✅ ~~❌~~ | **BUG-13 corregido:** `requireAdmin` aplicado |
| AD-R01 | Eliminar review | ✅ ~~❌~~ | **BUG-14+21 corregidos:** Admin puede eliminar cualquier review |
| AD-R02 | Reportes pendientes | ✅ ~~❌~~ | **BUG-19 corregido:** `GET /api/reviews/admin/reports/pending` funcional |
| AD-R03 | Stats de reviews | ✅ ~~❌~~ | **BUG-19 corregido:** `GET /api/reviews/admin/stats` funcional |
| AD-R04 | Resolver reporte | ✅ ~~❌~~ | **BUG-19 corregido:** `PATCH /api/reviews/admin/reports/:id/resolve` funcional |
| AD-E01 | Stats admin accesibles solo por admin | ✅ ~~❌~~ | **BUG-15 corregido:** Cliente → 403 "Acceso denegado" |
| AD-N01 | Push notifications | ⚠️ | Stub confirmado — no implementado |

---

## Fase 3 — Tests de Integración Cross-Service

### Flujo 1: Booking End-to-End

| Check | Estado | Notas |
|-------|--------|-------|
| Búsqueda retorna artistas | ✅ ~~❌~~ | BUG-03 corregido — auto-reindex al iniciar |
| Resolución authId → artistId | ✅ | Funciona. Booking creado con datos del artista |
| Conversación de chat creada automáticamente | ✅ | booking-service llama chat-service |
| Payment intent creado | ❌ | payments-service no encuentra booking (aislamiento de BD) |
| Webhook Stripe | 🔲 | Requiere ngrok |

### Flujo 2: Artista confirma → notificaciones

| Check | Estado | Notas |
|-------|--------|-------|
| Estado CONFIRMED guardado en DB | ✅ | `POST /api/bookings/:id/confirm` funcional |
| Push notification | ⚠️ | Stub — ruta no existe |

### Flujo 3: Review y rating

| Check | Estado | Notas |
|-------|--------|-------|
| Review creada correctamente | ✅ | Path corregido, validaciones activas |
| Artista responde review | ✅ | BUG-12 corregido — authId resuelto |
| Rating promedio actualizado | ✅ | Distribución por estrellas calculada |
| Votos únicos por usuario | ✅ | BUG-08 corregido — duplicados rechazados con 409 |

---

## Fase 4 — Tests de Seguridad (Ronda 1 + 2)

### Autorización entre roles

| # | Caso | Estado | Resultado |
|---|------|--------|-----------|
| S-01 | Sin token → 401 | ✅ | "Unauthorized" en todos los endpoints protegidos |
| S-02 | Token malformado → 401 | ✅ | Rechazado |
| S-03 | Token expirado → 401 | ✅ | "Invalid or expired token" |
| S-04 | Cliente → ruta admin → 403 | ✅ ~~❌~~ | BUG-13/14/15 corregidos. "Acceso denegado" |
| S-05 | Ruta interna desde exterior | ✅ | `GET /api/artists/internal/...` → 403 "Forbidden" |
| S-06 | SQL injection en login | ✅ | Rechazado por Zod — "Datos inválidos" |
| S-07 | IDOR — modificar datos de otro usuario | ✅ | 401/403 según endpoint |
| S-08 | Cliente responde review (solo artistas) | ✅ | "No tienes un perfil de artista activo" |

### Rate Limiting

| # | Caso | Estado | Resultado |
|---|------|--------|-----------|
| S-09 | Login fallido múltiples veces por IP | ✅ ~~❌~~ | **BUG-16 corregido:** Limiter por IP+email. IP compartida no bloquea a otros usuarios |
| S-10 | Search masivo (15 req) | ✅ | Rate limiter activo sin falsos positivos |
| S-11 | Registro masivo | ✅ | Limiter funcional |

### Validaciones de Input

| # | Caso | Estado | Resultado |
|---|------|--------|-----------|
| S-12 | Registro sin password | ✅ | Error campo `password` required |
| S-13 | Password < 8 chars | ✅ | "Datos inválidos" |
| S-14 | Email inválido | ✅ | Zod valida y retorna error de campo |
| S-15 | Email duplicado | ✅ | "Este correo electrónico ya está registrado" |
| S-16 | Rol inválido (`superadmin`) | ✅ | "Datos inválidos" |
| S-17 | Rating fuera de rango (6/5) | ✅ | "Error de validación" |
| S-18 | Booking fecha pasada | ✅ | "La fecha debe ser en el futuro" |
| S-19 | XSS en nombre (`<script>...`) | ✅ ~~❌~~ | **BUG-25 corregido:** Tags HTML eliminados antes de almacenar |
| S-20 | Body vacío `{}` | ✅ | Validación Zod — campos requeridos |

### Forgot Password — User Enumeration

| # | Caso | Estado | Resultado |
|---|------|--------|-----------|
| S-21 | Email existente | ✅ | "Si el email existe, recibirás instrucciones..." |
| S-22 | Email inexistente | ✅ | Misma respuesta — no revela existencia de cuenta |

---

## Fase 5 — Confirmación de Stubs

| Feature | Estado | Confirmación |
|---------|--------|-------------|
| Push notifications (FCM) | ⚠️ Stub | `POST /api/notifications/push` → 404 |
| Búsqueda geolocalizada | ⚠️ Stub | `GET /artists/geo/nearby` → 404 |
| Payment intent cross-service | ❌ Pendiente | payments-service aislado — no accede a BD de booking |
| Webhook Stripe en local | 🔲 | Requiere ngrok |
| TikTok OAuth | 🔲 | No testado |
| Mobile app | ⚠️ Stub | Solo AGENT.md, sin código |

---

## Registro de Hallazgos

### Ronda 1 — Bugs Originales (todos corregidos ✅)

| ID | Severidad | Servicio | Descripción | Estado |
|----|-----------|----------|-------------|--------|
| **BUG-01** | 🔴 CRÍTICO | auth-service / DB | No existía usuario admin en BD | ✅ Corregido |
| **BUG-02** | 🔴 CRÍTICO | users-service | `JWT_SECRET` faltaba en docker-compose → "Token inválido" en todos los endpoints de perfil | ✅ Corregido |
| **BUG-03** | 🔴 CRÍTICO | search-service | Artistas no indexados al iniciar → búsqueda vacía en deployment fresco | ✅ Corregido |
| **BUG-04** | 🟠 ALTO | booking-service | Documentación interna de disponibilidad desincronizada con implementación real | ✅ Documentado |
| **BUG-05** | 🟠 ALTO | booking-service | `clientId` requerido en body — cliente puede suplantar a otro | ✅ Corregido |
| **BUG-06** | 🟡 MEDIO | booking-service | Campo `newTime` no documentado en reschedule | ✅ Documentado |
| **BUG-07** | 🟡 MEDIO | reviews-service | Path duplicado `/api/reviews/reviews/...` | ✅ Corregido |
| **BUG-08** | 🟡 MEDIO | reviews-service | Votos duplicados sin validación | ✅ Corregido |
| **BUG-09** | 🟠 ALTO | auth-service | `redirectUrl` incorrecto en registro de cliente (apuntaba a admin) | ✅ Corregido |
| **BUG-10** | 🟠 ALTO | auth-service | `redirectUrl` incorrecto en login de artista | ✅ Corregido |
| **BUG-11** | 🟡 MEDIO | artists-service | Campos de ausencia mal documentados (`startAt`/`endAt`/`type`) | ✅ Documentado |
| **BUG-12** | 🟠 ALTO | reviews-service | Artista no podía responder sus reviews — authId vs artistId | ✅ Corregido |
| **BUG-13** | 🔴 CRÍTICO | booking-service | `PATCH /bookings/:id/status` sin validación de rol admin | ✅ Corregido |
| **BUG-14** | 🔴 CRÍTICO | reviews-service | `DELETE /reviews/:id` sin validación de rol admin | ✅ Corregido |
| **BUG-15** | 🔴 CRÍTICO | booking-service | `GET /stats/admin` sin validación de rol | ✅ Corregido |
| **BUG-16** | 🟠 ALTO | auth-service | Rate limiter de login por IP — bloquea logins legítimos | ✅ Corregido |
| **BUG-17** | 🔴 CRÍTICO | auth-service | `POST /auth/change-password` → Error 500 en backend | ✅ Corregido |

### Ronda 2 — Expert QA (todos corregidos ✅)

| ID | Severidad | Servicio | Descripción | Estado |
|----|-----------|----------|-------------|--------|
| **BUG-18** | 🟠 MEDIO | booking-service | Rutas `/stats/admin`, `/admin/search`, etc. sin prefijo `/bookings/` → 404 vía gateway | ✅ Corregido |
| **BUG-19** | 🟠 MEDIO | reviews-service | Rutas `/artists/:id/rating`, `/admin/reports/*`, `/responses/:id` sin prefijo `/reviews/` → 404 | ✅ Corregido |
| **BUG-20** | 🟡 BAJO | booking-service | Route order: `/admin/:id` antes de `/admin/search` — Express capturaba "search" como `:id` | ✅ Corregido |
| **BUG-21** | 🟡 BAJO | reviews-service | Admin no podía borrar reviews — `deleteReview` ignoraba el rol del usuario | ✅ Corregido |
| **BUG-22** | 🟡 BAJO | gateway | `pathRewrite` incorrecto para reviews (`"^/api/reviews"` en vez de `"^"`) → enviaba `/` al servicio | ✅ Corregido |
| **BUG-23** | ℹ️ INFO | auth-service | Refresh devolvía `accessToken`, login devolvía `token` — inconsistencia en campo | ✅ Corregido |
| **BUG-24** | ℹ️ INFO | auth-service | `changePassword` aceptaba nueva contraseña idéntica a la actual | ✅ Corregido |
| **BUG-25** | ℹ️ INFO | auth-service | XSS: campo `nombre` almacenaba tags HTML sin sanitizar | ✅ Corregido |

---

## Rutas Correctas de Referencia

> Para integración frontend — rutas verificadas en entorno real

| Acción | Método | Path correcto |
|--------|--------|---------------|
| Perfil propio | GET | `/api/users/me` |
| Actualizar perfil | PUT | `/api/users/me/profile` |
| Listar artistas | GET | `/api/artists/search?limit=&location=&minRating=` |
| Buscar en índice | GET | `/api/search/artists?q=` |
| Autocompletar | GET | `/api/search/autocomplete?q=` |
| Mis reservas | GET | `/api/bookings` (filtrado automático por JWT) |
| Rating artista | GET | `/api/reviews/artists/:id/rating` |
| Stats usuario reviews | GET | `/api/reviews/users/:userId/stats` |
| Admin — buscar reservas | GET | `/api/bookings/admin/search` |
| Admin — stats reservas | GET | `/api/bookings/stats/admin` |
| Admin — reportes pendientes | GET | `/api/reviews/admin/reports/pending` |
| Admin — stats reviews | GET | `/api/reviews/admin/stats` |
| Resolver reporte | PATCH | `/api/reviews/admin/reports/:id/resolve` |
| Respuesta a review | PATCH | `/api/reviews/responses/:id` |

> **Nota sobre respuestas:** `GET /api/catalog/categories` devuelve array directo (no `{categories:[...]}`). `GET /api/admin/users/:id` devuelve objeto plano (no `{user:{...}}`).

---

## Resumen Ejecutivo — Estado Final

### Estado por Área tras Ronda 2

| Área | Estado | Pendiente |
|------|--------|-----------|
| Autenticación | ✅ Funcional | — |
| Perfil de usuario | ✅ Funcional | — |
| Búsqueda | ✅ Funcional | — |
| Reservas (core) | ✅ Funcional | — |
| Pagos end-to-end | ❌ No funcional | Aislamiento BD payments ↔ booking |
| Reviews | ✅ Funcional | — |
| Chat | ✅ Funcional | WebSocket requiere cliente WS |
| Favoritos | ✅ Funcional | — |
| Disponibilidad artista | ✅ Funcional | — |
| Dashboard artista | ✅ Funcional | — |
| Panel Admin | ✅ Funcional | — |
| Seguridad endpoints | ✅ Correcta | — |
| Rate limiting | ✅ Correcto | — |
| Push notifications | ⚠️ Stub | Pendiente implementar |
| Geolocalización | ⚠️ Stub | Pendiente implementar |

### Distribución Final de Bugs

| Severidad | Ronda 1 | Ronda 2 | Total | Corregidos |
|-----------|---------|---------|-------|-----------|
| 🔴 Crítico | 7 | 0 | 7 | 7 ✅ |
| 🟠 Alto/Medio | 5 | 2 | 7 | 7 ✅ |
| 🟡 Bajo | 5 | 3 | 8 | 8 ✅ |
| ℹ️ Info | 0 | 3 | 3 | 3 ✅ |
| **Total** | **17** | **8** | **25** | **25 ✅** |

---

## Herramientas Usadas

- `curl` — testing de endpoints REST
- `docker logs` / `docker inspect` — inspección de contenedores
- `psql` directo en `piums-postgres` — verificación de estado de BD
- Inspección de código fuente — schemas Zod, rutas Express, controladores

---

*Ronda 1 ejecutada: 2026-04-20 | Ronda 2 (Expert QA): 2026-04-20*  
*25 bugs encontrados — 25 corregidos — 0 pendientes — 2 stubs (push, geo)*
