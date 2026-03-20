# Sistema de Disponibilidad - PIUMS

Sistema completo para gestionar la agenda de artistas y evitar solapamientos de reservas.

## 📊 Arquitectura

### 3 Capas de Disponibilidad

```
┌─────────────────────────────────────────────────────┐
│  1. Horarios Regulares (artist_availability_rules)  │
│     Lunes-Viernes: 9:00-18:00                       │
│     Sábados: 10:00-15:00                            │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  2. Bloqueos Puntuales (artist_blackouts)           │
│     25 Feb: Vacaciones                              │
│     3 Mar, 14:00-16:00: Cita personal               │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  3. Reservas Confirmadas (availability_reservations) │
│     20 Feb, 10:00-12:00 → Booking #123              │
│     22 Feb, 15:00-17:00 → Booking #456              │
└─────────────────────────────────────────────────────┘
```

## 🗃️ Tablas de Base de Datos

### artists-service (piums_artists)

**artist_availability_rules**
```sql
id          uuid    PK
artistId    uuid    FK → artists.id
dayOfWeek   enum    (LUNES, MARTES, ..., DOMINGO)
startTime   text    "09:00"
endTime     text    "18:00"
isActive    boolean default true
```

**artist_blackouts**
```sql
id          uuid      PK
artistId    uuid      FK → artists.id
startAt     timestamp Fecha/hora inicio del bloqueo
endAt       timestamp Fecha/hora fin del bloqueo
reason      text      Motivo del bloqueo
```

### booking-service (piums_bookings)

**availability_reservations**
```sql
id          uuid      PK
artistId    uuid      Artista cuya agenda se bloquea
bookingId   uuid      UNIQUE - Booking que genera el bloqueo
startAt     timestamp Inicio del bloqueo
endAt       timestamp Fin del bloqueo
```

## 🔄 Flujo de Verificación de Disponibilidad

```javascript
checkAvailability(artistId, startAt, endAt) {
  
  // 1️⃣ Verificar horario regular
  ¿El artista trabaja este día/hora normalmente?
  NO → return { available: false }
  
  // 2️⃣ Verificar bloqueos puntuales
  ¿Hay un blackout que se solape con este rango?
  SÍ → return { available: false }
  
  // 3️⃣ Verificar reservas confirmadas
  ¿Hay un booking confirmado en este rango?
  SÍ → return { available: false }
  
  // ✅ Si pasó todas las validaciones
  return { available: true }
}
```

## 📡 Endpoints Disponibles

### booking-service (puerto 4005)

**Verificar Conflicto de Reserva**
```http
GET /api/availability/check-reservation
Query params:
  - artistId: string
  - startAt: ISO 8601 datetime
  - endAt: ISO 8601 datetime

Response:
{
  "hasReservation": boolean,
  "bookingId": string | undefined
}
```

**Obtener Reservas de un Artista**
```http
GET /api/availability/artist/:artistId
Query params:
  - startDate: ISO 8601 date
  - endDate: ISO 8601 date

Response:
{
  "artistId": string,
  "startDate": datetime,
  "endDate": datetime,
  "reservations": Array<Reservation>,
  "count": number
}
```

### artists-service (puerto 4003)

Los servicios de disponibilidad están disponibles programáticamente:

```typescript
import {
  checkAvailability,
  getWeeklyAvailability,
  setAvailabilityRule,
  removeAvailabilityRule,
  createBlackout,
  getUpcomingBlackouts,
  removeBlackout,
} from './services/availability.service';
```

## 🎯 Casos de Uso

### 1. Configurar Horario Regular de un Artista

```typescript
// Lunes a Viernes: 9:00 - 18:00
for (const day of ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']) {
  await setAvailabilityRule({
    artistId: 'artist-123',
    dayOfWeek: day,
    startTime: '09:00',
    endTime: '18:00',
  });
}
```

### 2. Bloquear Vacaciones

```typescript
await createBlackout({
  artistId: 'artist-123',
  startAt: new Date('2026-03-01T00:00:00Z'),
  endAt: new Date('2026-03-15T23:59:59Z'),
  reason: 'Vacaciones de verano',
});
```

### 3. Verificar Disponibilidad Antes de Crear Booking

```typescript
const result = await checkAvailability(
  'artist-123',
  new Date('2026-02-25T10:00:00Z'),
  new Date('2026-02-25T12:00:00Z')
);

if (!result.available) {
  throw new Error(`Artist not available: ${result.reason}`);
}

// Crear booking...
```

### 4. Crear Reserva de Disponibilidad al Confirmar Booking

```typescript
// Cuando un booking cambia a status CONFIRMED
await createAvailabilityReservation({
  artistId: booking.artistId,
  bookingId: booking.id,
  startAt: booking.scheduledDate,
  endAt: new Date(booking.scheduledDate.getTime() + booking.durationMinutes * 60000),
});
```

### 5. Liberar Disponibilidad al Cancelar Booking

```typescript
// Cuando un booking se cancela
await removeAvailabilityReservation(booking.id);
```

## 🧪 Pruebas

Ejecuta el script de pruebas:

```bash
cd /Users/piums/Desktop/piums-platform
./services/test-availability.sh
```

O prueba manualmente con curl:

```bash
# Verificar si hay reserva en un rango
curl "http://localhost:4005/api/availability/check-reservation?artistId=artist-123&startAt=2026-02-25T10:00:00Z&endAt=2026-02-25T12:00:00Z"

# Ver todas las reservas de un artista en un mes
curl "http://localhost:4005/api/availability/artist/artist-123?startDate=2026-02-01&endDate=2026-02-28"
```

## ⚠️ Consideraciones Importantes

### Zonas Horarias
- Todos los timestamps deben estar en **UTC**
- El frontend debe convertir a la zona horaria local del usuario
- Las reglas de disponibilidad (startTime/endTime) son strings y se interpretan en la zona horaria del artista

### Solapamientos
El sistema detecta cualquier solapamiento, incluyendo:
- ✅ Reserva que contiene completamente el rango solicitado
- ✅ Reserva que se solapa con el inicio del rango
- ✅ Reserva que se solapa con el fin del rango
- ✅ Reserva dentro del rango solicitado

### Performance
- Las consultas usan índices en `artistId`, `startAt`, `endAt`
- La verificación de disponibilidad hace **1 consulta local + 1 HTTP call**
- Para calendarios completos, considera cachear los resultados

### Integridad
- `availability_reservations.bookingId` es **UNIQUE** → 1 reserva por booking
- Al cancelar un booking, se debe eliminar la reserva de disponibilidad
- Los blackouts no se eliminan automáticamente, solo se marcan como inactivos

## 🔜 Próximos Pasos

1. **Agregar buffer entre citas** - Tiempo de preparación/traslado
2. **Recurrencia en blackouts** - Bloqueos semanales
3. **Disponibilidad por servicio** - Algunos servicios solo en ciertos días
4. **Notificaciones** - Alertar cuando se intenta reservar en horario bloqueado
5. **Admin UI** - Panel para que artistas gestionen su disponibilidad

## 📝 Migraciones Pendientes

Si ya tienes bookings confirmados, necesitas crear las reservas de disponibilidad:

```typescript
// Script de migración
const confirmedBookings = await prisma.booking.findMany({
  where: { 
    status: 'CONFIRMED',
    scheduledDate: { gte: new Date() } // Solo futuros
  }
});

for (const booking of confirmedBookings) {
  await createAvailabilityReservation({
    artistId: booking.artistId,
    bookingId: booking.id,
    startAt: booking.scheduledDate,
    endAt: new Date(
      booking.scheduledDate.getTime() + 
      booking.durationMinutes * 60000
    ),
  });
}
```

## 🆘 Troubleshooting

**Error: "Unable to verify existing bookings"**
- Verifica que booking-service esté corriendo en puerto 4005
- Revisa la variable `BOOKING_SERVICE_URL` en artists-service

**Error: "Artist not available"**
- Verifica que el artista tenga reglas de disponibilidad configuradas
- Revisa si hay blackouts activos en ese rango
- Consulta las reservas existentes con el endpoint GET /api/availability/artist/:artistId
