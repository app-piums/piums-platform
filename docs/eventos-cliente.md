# Eventos del Cliente — Multi-Artista

## Concepto

El sistema de **Eventos** permite que un cliente agrupe múltiples reservas de artistas bajo un mismo evento (ej. una boda donde quiere contratar una banda, un fotógrafo y un DJ).

Cada artista mantiene su propia reserva independiente con su propio pago, pero todas quedan vinculadas al mismo `eventId`. Cuando dos o más reservas del evento quedan confirmadas, se crea automáticamente un chat grupal exclusivo entre los artistas para que coordinen — el cliente nunca tiene acceso a ese chat.

---

## Modelos de datos

**Servicio:** `booking-service`  
**Base de datos:** `piums_bookings`  
**Schema:** `services/booking-service/prisma/schema.prisma`

### `Event`

```prisma
model Event {
  id          String    @id @default(uuid())
  clientId    String
  name        String
  description String?
  location    String?
  eventDate   DateTime?
  notes       String?
  status      EventStatus @default(DRAFT)
  bookings    Booking[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

enum EventStatus {
  DRAFT
  ACTIVE
  COMPLETED
  CANCELLED
}
```

La relación con `Booking` es a través del campo `eventId` en el modelo `Booking` — un booking puede o no pertenecer a un evento.

---

## Backend

### Rutas (`/api/events`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/events` | Crear evento |
| `GET` | `/api/events` | Mis eventos (cliente autenticado) |
| `GET` | `/api/events/:id` | Detalle del evento + reservas |
| `PATCH` | `/api/events/:id` | Editar nombre, fecha, lugar, notas |
| `DELETE` | `/api/events/:id` | Cancelar evento (opción: cancelar reservas asociadas) |
| `POST` | `/api/events/:id/bookings` | Asociar una reserva existente al evento |
| `DELETE` | `/api/events/:id/bookings/:bookingId` | Quitar reserva del evento |
| `GET` | `/api/events/:id/breakdown` | Resumen de costos totales del evento |

### Trigger del chat grupal de artistas

Ubicado en `services/booking-service/src/services/booking.service.ts`, dentro del método `confirmBooking()`:

```
Al confirmar una reserva que tiene eventId:
  1. Busca todas las reservas CONFIRMED del mismo evento
  2. Si hay ≥ 2 reservas confirmadas:
     → Llama a chatClient.createOrGetGroupConversation({
         eventId,
         participantIds: [artistId de cada reserva confirmada],
         name: "Coordinación: {nombre del evento}"
       })
  3. El grupo se crea una sola vez (upsert por eventId)
  4. Cada nueva confirmación agrega al artista al grupo existente
```

El grupo se crea en el `chat-service` usando el modelo `GroupConversation` con `eventId` como referencia única.

---

## SDK

**Archivo:** `packages/sdk/src/index.ts`

```typescript
// Crear un evento
sdk.createEvent({ name, description?, location?, eventDate?, notes? })

// Listar mis eventos
sdk.getClientEvents()

// Detalle de un evento
sdk.getEvent(eventId)

// Editar evento
sdk.updateEvent(eventId, { name?, description?, location?, eventDate?, notes? })

// Cancelar evento
sdk.cancelEvent(eventId, cancelBookings: boolean)

// Agregar reserva existente al evento
sdk.addBookingToEvent(eventId, bookingId)

// Quitar reserva del evento
sdk.removeBookingFromEvent(eventId, bookingId)

// Resumen de costos del evento
sdk.getEventBreakdown(eventId)
```

---

## Frontend — web-client

### `/events` — Lista de eventos

- Cards por evento con: nombre, fecha, estado, número de artistas, total estimado
- Botón "Crear evento" → modal con nombre, descripción, fecha, lugar
- Estados visibles: Borrador / Activo / Completado / Cancelado

### `/events/[id]` — Detalle del evento

**Sección "Artistas":**
- Lista todas las reservas asociadas con su estado individual
- Botón "Agregar artista" → selecciona de las reservas existentes del cliente
- Cada reserva muestra: nombre del artista, servicio, precio, estado

**Sección de costos:**
- Breakdown total del evento (suma de todas las reservas)

**Acciones:**
- Editar datos del evento (modal)
- Cancelar evento — con checkbox opcional para cancelar también las reservas pendientes/confirmadas

---

## Flujo completo

```
1. Cliente crea evento "Boda de Ana y Luis" con fecha y lugar

2. Reserva artistas de forma independiente:
   - Reserva la banda desde /artists/{id}
   - Reserva el fotógrafo desde /artists/{id}
   - Reserva el DJ desde /artists/{id}

3. Va a /events → entra al evento → "Agregar artista"
   → asocia las 3 reservas al evento

4. Los artistas confirman sus reservas en el dashboard

5. Al confirmarse la 2ª reserva:
   → se crea automáticamente GroupConversation en chat-service
   → todos los artistas del evento son participantes

6. Los artistas coordinan entre sí en el chat grupal
   → el cliente NO tiene acceso a ese chat
   → cada artista sigue teniendo su chat 1-a-1 con el cliente

7. Cliente ve el estado de todos sus artistas en un solo lugar
   con el total de gasto del evento
```

---

## Reglas de negocio

- Un `Event` pertenece a un único cliente
- Una reserva solo puede estar en un evento a la vez
- Cancelar el evento no cancela las reservas automáticamente — el cliente elige si quiere cancelarlas también
- El chat grupal de artistas se crea la primera vez que hay ≥ 2 reservas confirmadas en el evento; los siguientes artistas que confirmen se agregan al grupo existente
- El cliente nunca ve el chat de coordinación entre artistas

---

## Archivos clave

| Archivo | Descripción |
|---------|-------------|
| `services/booking-service/prisma/schema.prisma` | Modelo `Event` y relación con `Booking` |
| `services/booking-service/src/services/booking.service.ts` | Trigger del chat grupal en `confirmBooking()` |
| `services/booking-service/src/clients/chat.client.ts` | Llamada interna a chat-service para crear grupo |
| `services/chat-service/src/services/group-chat.service.ts` | Creación y gestión de `GroupConversation` |
| `apps/web-client/web/src/app/events/page.tsx` | Lista de eventos del cliente |
| `apps/web-client/web/src/app/events/[id]/page.tsx` | Detalle del evento con reservas y acciones |
| `packages/sdk/src/index.ts` | Métodos `createEvent`, `getEvent`, `addBookingToEvent`, etc. |
