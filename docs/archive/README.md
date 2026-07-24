# Archivo histórico

Documentos que describen etapas ya superadas del proyecto. **No los uses como
referencia de cómo funciona la plataforma hoy**: se conservan porque explican
por qué se tomaron ciertas decisiones, no cómo operar el sistema actual.

Para lo vigente:

| Necesitas | Documento |
|---|---|
| Desplegar el backend | [`../DEPLOY_DIGITALOCEAN.md`](../DEPLOY_DIGITALOCEAN.md) |
| Desplegar las webs | [`../DEPLOY_VERCEL.md`](../DEPLOY_VERCEL.md) |
| Levantar el entorno local | [`../guides/getting-started.md`](../guides/getting-started.md) |
| Flujo de ramas y PRs | [`../guides/contributing.md`](../guides/contributing.md) |

## Qué hay aquí y por qué se archivó

| Documento | Fecha | Por qué ya no aplica |
|---|---|---|
| `DEPLOYMENT.md` | 2026-03 | Deploy por Droplet + `docker-compose.prod.yml`, y AWS. Prod hoy es DOKS. |
| `DEPLOYMENT_GUIDE.md` | 2026-03 | Segunda versión de lo mismo, igual de superada. |
| `plan-despliegue-digitalocean.md` | 2026-06 | Era el *plan* previo al deploy. Lo que se ejecutó quedó en `DEPLOY_DIGITALOCEAN.md`. |
| `QUICK_START.md` | 2026-02 | Arranque de la época en que todo corría en Compose. |
| `IMPLEMENTACIONES_RESUMEN.md` | 2026-02 | Fotografía de lo implementado en febrero. |
| `ESTADO_PROYECTO_CHECKLIST.md` | 2026-03 | Checklist de estado de marzo; describe infra AWS que nunca se aplicó. |
| `PLAN_QA.md` | 2026-04 | Plan de una ronda de QA ya ejecutada. |
| `LOCATION_PERSISTENCE_FIX.md` | 2026-04 | Post-mortem de un bug ya corregido. |
| `BACKLOG_INTEGRACION.md` | 2026-03 | Backlog de integraciones, en su mayoría hechas. |
| `FRONTEND_INTEGRATION.md` | 2026-02 | Integración web previa a la migración a Vercel. |
| `BOOKING_NOTIFICATIONS_INTEGRATION.md` | 2026-02 | Integración ya en producción; el comportamiento vive en el código. |
| `checklist-implementacion.md` | 2026-05 | Checklist de payments/bookings ya completado. |
| `PROJECT_STATUS.md` | 2026-04 | Estado del proyecto en abril, cuando cerró el sistema de reservas. |
