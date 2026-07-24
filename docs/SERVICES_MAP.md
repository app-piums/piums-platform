# SERVICES_MAP.md

## 1) Mapa general

| Componente | Tipo | Puerto (dev) | Responsabilidad principal |
|---|---|---:|---|
| gateway | app | 3000 | Entrada unica API, enrutamiento, politicas basicas |
| auth-service | service | 4001 | Registro, login, tokens, sesiones, identidad |
| users-service | service | 4002 | Perfil de usuario, preferencias, direcciones |
| artists-service | service | 4003 | Perfil/artista, capacidades y gestion relacionada |
| catalog-service | service | 4004 | Catalogo de servicios/categorias |
| payments-service | service | 4005 | Cobros, estados de pago, conciliacion de eventos |
| reviews-service | service | 4006 | Reseñas, reportes y reputacion |
| notifications-service | service | 4007 | Email/SMS/push y plantillas de notificacion |
| booking-service | service | 4008 | Reservas, disponibilidad y reglas de negocio |
| search-service | service | 4009 | Busqueda y filtros |
| chat-service | service | 4010 | Conversaciones y mensajeria |
| postgres | infra | 5432 | Persistencia relacional |
| redis | infra | 6379 | Cache, sesiones y soporte transitorio |

## 2) Frontends

| Frontend | Tipo | Rol principal |
|---|---|---|
| web-client | web | Cliente final (explorar, reservar, pagar) |
| web-artist | web | Artista (servicios, agenda, ingresos) |
| web-admin | web | Operacion y soporte |
| mobile | mobile | Cliente movil |

## 3) Dependencias de alto nivel

- gateway depende de todos los servicios de dominio.
- auth-service se integra con users-service, artists-service, booking-service y reviews-service.
- booking-service suele integrarse con payments-service y notifications-service.
- search-service agrega/consulta datos indexables de artists/catalog.
- chat-service depende de identidad y metadatos de usuarios.

## 4) Convenciones operativas sugeridas

- URL interna por servicio: `http://<service-name>:<port>`.
- Timeouts internos conservadores y reintentos acotados.
- Propagacion de `x-request-id` entre gateway y servicios.
- Logs estructurados por `service`, `operation`, `actor`, `requestId`.

## 5) Checklist rapido de salud por servicio

- Arranca y responde `/health` (o endpoint equivalente).
- Conexion a DB/Redis valida.
- Variables de entorno minimas presentes.
- Migraciones al dia para su esquema.
