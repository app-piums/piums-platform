# API_CONTRACTS.md

## 1) Objetivo

Definir reglas minimas de contrato API para evitar rupturas entre frontend, gateway y microservicios.

## 2) Convenciones de endpoints

- Base publica sugerida: `/api/<dominio>`
- Versionado recomendado: `/api/v1/<dominio>` para contratos estables.
- Rutas internas deben evitar exponer detalles de infraestructura.

## 3) Convenciones de request

Headers recomendados:

- `Authorization: Bearer <token>`
- `Content-Type: application/json`
- `x-request-id: <uuid>`
- `x-internal-service: <service-name>` (solo trafico interno confiable)

Reglas:

- Validar payload con esquema (zod u otro).
- No aceptar campos desconocidos en operaciones criticas.
- Paginacion explicita en listados (`page`, `limit`, `sort`).

## 4) Convenciones de response

Exito:

```json
{
  "data": {},
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-04-16T12:00:00Z"
  }
}
```

Error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Payload invalido",
    "details": []
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-04-16T12:00:00Z"
  }
}
```

## 5) Catalogo minimo de codigos de error

- `VALIDATION_ERROR` -> 400
- `UNAUTHORIZED` -> 401
- `FORBIDDEN` -> 403
- `NOT_FOUND` -> 404
- `CONFLICT` -> 409
- `RATE_LIMITED` -> 429
- `INTERNAL_ERROR` -> 500
- `UPSTREAM_UNAVAILABLE` -> 503

## 6) Contratos transversales criticos

### Auth -> Users

- Al registrar usuario, auth debe enviar los campos minimos del perfil base:
- `authId`, `email`, `nombre`, `pais` y, cuando aplique, `ciudad`.

### Booking -> Payments

- `bookingId` unico por transaccion.
- Operaciones de confirmacion de pago deben ser idempotentes.

### Booking/Payments -> Notifications

- Enviar eventos de negocio ya validados (reserva creada, pago confirmado, pago fallido).

## 7) Compatibilidad y cambios

- Evitar breaking changes sin version nueva.
- Agregar campos nuevos como opcionales primero.
- Mantener deprecaciones documentadas por al menos un ciclo de release.

## 8) Pruebas de contrato

Recomendado:

- Tests de contrato por servicio (consumer-driven o snapshots de schema).
- Smoke tests en CI para endpoints criticos:
- login, registro, creacion de reserva, confirmacion de pago.

## 9) Referencias del repositorio

- Contrato OpenAPI consolidado: `docs/api-contracts/openapi.yaml`
- Documentacion API: `docs/api-contracts/README.md`
