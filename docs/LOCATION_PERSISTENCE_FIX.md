# Persistencia de Ubicación del Evento

## Problema Identificado
Cuando el usuario seleccionaba manualmente una ubicación para un evento/booking, el backend podía sobrescribirla automáticamente con la dirección por defecto del perfil del usuario.

## Solución Implementada

### Archivo modificado
- `services/booking-service/src/services/booking.service.ts` - función `createBooking()`

### Lógica actualizada

**Antes:**
```typescript
// Sobrescribía si no había coordenadas, incluso si había string de ubicación
if ((!data.locationLat || !data.locationLng) && data.clientId) {
  // ...autocompletar desde dirección por defecto
  data.location = defaultAddr.label || ...
}
```

**Ahora:**
```typescript
// Solo autocompleta si el usuario NO proporcionó NINGUNA ubicación explícita
const hasExplicitLocation = data.location || data.locationLat || data.locationLng;

if (!hasExplicitLocation && data.clientId) {
  // ...autocompletar desde dirección por defecto
}
```

## Comportamiento Esperado

| Caso | Antes | Ahora |
|------|-------|-------|
| Usuario selecciona ubicación manual | ❌ Se sobrescribía si faltaban coords | ✅ Se respeta siempre |
| Usuario proporciona coordenadas GPS | ✅ Se respetaba | ✅ Se respeta |
| Usuario NO proporciona ubicación | ✅ Autocompleta desde perfil | ✅ Autocompleta desde perfil |
| Usuario edita ubicación después | ✅ Se respeta el cambio | ✅ Se respeta el cambio |

## Validación

### Crear booking con ubicación explícita
```bash
curl -X POST http://localhost:3005/api/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "artistId": "...",
    "serviceId": "...",
    "scheduledDate": "2026-04-20T15:00:00Z",
    "durationMinutes": 120,
    "location": "Ubicación personalizada del evento"
  }'
```

**Resultado esperado:** El booking se crea con `location: "Ubicación personalizada del evento"` sin sobrescribirse.

### Crear booking sin ubicación
```bash
curl -X POST http://localhost:3005/api/bookings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "artistId": "...",
    "serviceId": "...",
    "scheduledDate": "2026-04-20T15:00:00Z",
    "durationMinutes": 120
  }'
```

**Resultado esperado:** El sistema autocompleta con la dirección por defecto del perfil del usuario.

## Notas Técnicas

- El cambio aplica solo para **creación** de bookings
- La función `updateBooking()` ya manejaba correctamente la persistencia (no tenía lógica de autocompletar)
- Los Events (`event.service.ts`) no tienen lógica de autocompletar, solo guardan lo que reciben
- Frontend en `apps/web-client/web/src/app/booking/page.tsx` ya usa `setLocation((prev) => prev || ...)` para evitar sobrescribir ubicación existente

## Fecha de implementación
13 de abril de 2026

## Servicios afectados
- `booking-service` (puerto 4008)

## Testing recomendado
1. Crear evento con ubicación manual → Verificar que se mantiene
2. Crear booking asociado a ese evento → Verificar que hereda la ubicación
3. Editar ubicación del evento → Verificar que no se revierte
4. Crear booking sin ubicación → Verificar que autocompleta desde perfil
