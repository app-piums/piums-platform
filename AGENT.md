# AGENT.MD — Estado Actual PIUMS Platform

**Fecha**: 17 de marzo de 2026  
**Branch principal**: `dave` (sin cambios pendientes, commit y push exitosos)

## Cambios recientes
- Traducción parcial de interfaz (pendiente revisión completa).
- Unificación de menús en web-artist (DashboardSidebar actualizado).
- Nueva página de chat para artista (mock data, integración pendiente).
- Commit y push exitosos, sin archivos pendientes.
- Scripts de issues ejecutados, Prisma Client regenerado en todos los servicios.

## Estado de la rama `dave`
- Sin cambios pendientes ni conflictos.
- Últimos commits reflejan features de booking codes, payouts, ER model, y mejoras de seguridad/auth.
- Documentación y checklist actualizados.

## Áreas principales del proyecto
- **Microservicios**: auth, booking, payments, notifications, chat, catalog, reviews, search, users, artists.
- **Frontend**: web-client, web-artist, mobile.
- **Infraestructura**: Docker, K8s, Nginx, Terraform.
- **Documentación**: features, integración, deployment, ER model.

## Problemas resueltos
- Regeneración de Prisma Client.
- Fixes en auth-service (bcryptjs).
- Unificación de menús y estructura de dashboard.
- Notificaciones de reserva y pagos funcionando.

## Problemas/tareas pendientes
- Integración real de chat artista.
- Endpoint de avatar upload.
- Métodos de pago backend (Stripe).
- Revisión completa de traducción.
- Unificación de menús entre apps.
- Optimización de notificaciones y logs.

## Recomendaciones próximos pasos
- Priorizar integración real de chat y endpoints de avatar/payment.
- Auditar traducción y menús para consistencia.
- Revisar logs y ejecutar scripts de issues periódicamente.
- Documentar avances y checklist en AGENT.MD.
