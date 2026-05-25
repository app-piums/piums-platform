# Security Review — Branch `dave`

**Revisado por:** Claude Code Security Review  
**Fecha:** 2026-05-25  
**Rama:** `dave` vs `main`  
**Scope:** ~300 archivos modificados en web-artist, web-client, gateway y 8 microservicios backend

---

## Resultado: Sin vulnerabilidades de alta confianza

Tras un análisis en tres fases — identificación inicial de vulnerabilidades, filtrado paralelo de falsos positivos y umbral de confianza — **ningún hallazgo supera el umbral del 80% de confianza.**

---

## Candidatos investigados y descartados

### 1. Open redirect en Google Calendar OAuth (`/api/auth/google/calendar-connect`)

**Descartado.** Existe un `returnUrl` no validado en `services/auth-service/src/routes/oauth.routes.ts:125`, pero la explotación requiere un JWT de usuario válido y firmado. Sin ese JWT, el flujo OAuth no puede iniciarse. No se transmite ningún dato sensible en la URL de redirección.

---

### 2. Firebase API key en Dockerfiles

**Descartado.** Las variables `NEXT_PUBLIC_FIREBASE_*` están diseñadas para ser públicas según la documentación de Next.js y del propio Firebase. La seguridad de Firebase se aplica mediante Security Rules y restricciones de dominio, no por el secreto de la API key.

---

### 3. Endpoint de subida de documentos — sin forwarding de auth

**Descartado.** El backend omite intencionalmente la autenticación en `POST /api/users/documents/upload` para soportar el flujo de registro de artistas previo a la autenticación (comentario en el código: *"No requiere autenticación (se llama durante el registro del artista)"*). El endpoint de eliminación correspondiente sí requiere auth correctamente.

---

### 4. Fallback de verificación de webhooks de Tilopay

**Descartado.** El método `verifyWebhookSignature()` (V1 legacy) es código muerto — nunca se llama. Todos los callbacks de webhook pasan por `verifyOrderHashV2()` con comparación HMAC-SHA256 segura ante timing attacks antes de cualquier cambio de estado.

---

### 5. Dominio de `returnUrl` en OAuth state sin allowlist

**Descartado.** Igual que el hallazgo #1: requiere posesión de un JWT de usuario válido para embeber un `returnUrl` controlado por el atacante en el JWT state. El impacto sin un token comprometido es negligible.

---

### 6. Parámetro `folder` en subida de documentos

**Descartado.** El backend valida el parámetro contra una whitelist estricta (`['front', 'back', 'selfie', 'avatar']`) y rechaza cualquier otro valor con error 400. La inyección de carpeta en Cloudinary es de bajo impacto por naturaleza.

---

## Observaciones de seguridad positivas

- Rate limiting aplicado en el gateway y por servicio (`rateLimiter.ts` presente en todos los servicios), con `/health` correctamente exento para evitar interferencia con los probes de kubelet.
- Las auth cookies usan `httpOnly: true` y `sameSite: strict` en todas las rutas de login.
- Los JWT usan `timingSafeEqual` en el verificador de webhooks de Tilopay.
- Los endpoints internos de servicio a servicio usan validación de header `INTERNAL_SERVICE_SECRET`.
- Prisma ORM se usa en todo el backend — no se encontró interpolación de SQL crudo.

---

*Sin acciones requeridas desde el punto de vista de seguridad. El codebase sigue buenas prácticas de seguridad para una arquitectura Next.js + microservicios.*
