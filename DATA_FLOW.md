# DATA_FLOW.md

## 1) Flujo de registro y provision de perfil

1. Cliente envia registro a `gateway`.
2. `gateway` enruta a `auth-service`.
3. `auth-service` valida, crea identidad y credenciales.
4. `auth-service` notifica/provisiona `users-service` para perfil base.
5. Se emiten tokens y se devuelve respuesta al cliente.

Resultado esperado:

- Identidad en auth y perfil base en users consistentes.

## 2) Flujo de login y sesion

1. Cliente envia credenciales a `gateway`.
2. `auth-service` verifica usuario/password o proveedor OAuth.
3. `auth-service` emite access/refresh token.
4. Cliente usa token en llamadas siguientes.

Controles:

- Expiracion de token.
- Revocacion/rotacion de refresh token.

## 3) Flujo de busqueda y descubrimiento

1. Cliente consulta catalogo/filtros por `gateway`.
2. `search-service` y/o `catalog-service` responden resultados.
3. `artists-service` complementa metadata de artista.
4. Gateway agrega y devuelve payload para UI.

## 4) Flujo de reserva

1. Cliente selecciona artista/servicio y fecha.
2. `booking-service` valida disponibilidad y reglas.
3. Se crea reserva en estado inicial (`PENDING` o equivalente).
4. `notifications-service` puede emitir confirmaciones iniciales.

## 5) Flujo de pago

1. Reserva requiere cobro.
2. `payments-service` inicia/confirmar intento de pago (ej. Stripe).
3. `booking-service` actualiza estado de reserva segun resultado.
4. `notifications-service` notifica exito o fallo.

Punto critico:

- Idempotencia en confirmaciones de pago para evitar doble cargo.

## 6) Flujo de resenas

1. Tras servicio completado, cliente envia resena.
2. `reviews-service` valida elegibilidad (reserva completada, reglas).
3. Actualiza reputacion y reportes derivados.

## 7) Flujo de chat

1. Usuario inicia conversacion desde UI.
2. `chat-service` crea/recupera canal y mensajes.
3. Se usan IDs de contexto normalizados para participantes.

## 8) Errores y recuperacion

- Timeouts entre servicios deben devolver errores controlados.
- Operaciones no criticas (notificaciones/perfiles secundarios) pueden ser fail-soft.
- Eventos de compensacion o reproceso cuando un paso lateral falla.

## 9) Observabilidad recomendada

- `x-request-id` desde gateway hasta ultimo servicio.
- Logs con correlacion de actor y booking/payment/review ids.
- Metricas basicas: latencia, tasa de error, throughput por endpoint.
