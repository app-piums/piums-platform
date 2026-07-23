# ARCHITECTURE.md

## 1) Resumen

PIUMS Platform usa una arquitectura de microservicios en monorepo:

- Un gateway centraliza entrada HTTP y enruta a servicios internos.
- Servicios de dominio separados por responsabilidad (auth, users, artists, booking, payments, etc.).
- Frontends independientes por tipo de usuario (cliente, artista, admin).
- Persistencia principal en PostgreSQL por contexto de servicio.
- Redis para cache/sesiones y mensajeria ligera.

## 2) Capas del sistema

### Capa de Presentacion

- `apps/web-client`: experiencia cliente
- `apps/web-artist`: panel artista
- `apps/web-admin`: administracion
- `apps/mobile`: cliente movil

### Capa de Entrada

- `apps/gateway`: API Gateway (BFF ligero + enrutamiento)

Responsabilidades:

- Routing interno hacia servicios
- CORS y politicas de acceso
- Estandarizacion basica de headers/contexto

### Capa de Dominio (Microservicios)

- `services/auth-service`
- `services/users-service`
- `services/artists-service`
- `services/catalog-service`
- `services/booking-service`
- `services/payments-service`
- `services/reviews-service`
- `services/notifications-service`
- `services/search-service`
- `services/chat-service`

### Capa de Datos e Infra

- PostgreSQL (multiples bases por contexto)
- Redis
- Docker Compose para desarrollo local
- Integraciones externas (Stripe, Cloudinary, SMTP/SendGrid, Twilio, FCM)

## 3) Principios de diseno

- **Bounded context por servicio**: cada servicio posee su logica y modelos.
- **Acoplamiento bajo por HTTP interno**: comunicacion servicio-a-servicio via API.
- **Escalado independiente**: servicios pueden desplegarse y escalar por separado.
- **Fail-soft**: en integraciones no criticas se prioriza no romper el flujo principal.

## 4) Patrones de comunicacion

- Cliente -> Gateway -> Servicio(s)
- Servicio -> Servicio por HTTP interno
- Notificaciones como efecto colateral (email/sms/push) despues de transacciones de negocio

## 5) Seguridad y confianza

- JWT para autenticacion y autorizacion
- Roles principales: cliente, artista, admin
- Separacion entre identificadores de auth y perfiles funcionales
- Headers internos para contexto entre servicios cuando aplica

## 6) Despliegue y ejecucion

- Desarrollo: `infra/docker/docker-compose.dev.yml`
- Build por servicio y frontend segun su `Dockerfile`/pipeline
- Estrategia recomendada: despliegues por servicio con validacion de contratos

## 7) Riesgos arquitectonicos actuales

- Desalineacion de contratos entre servicios al evolucionar rapido.
- Diferencias de IDs entre contextos (authId vs profileId) si no se normaliza en gateway/servicios.
- Dependencias cruzadas de dominio si se filtra demasiada logica al gateway.

## 8) Recomendaciones

- Versionar contratos API por servicio.
- Definir catalogo unico de headers internos y trazabilidad (request-id, actor-id).
- Mantener pruebas de integracion cruzada para auth/users/booking/payments.
- Publicar changelog tecnico por servicio en cada release.
