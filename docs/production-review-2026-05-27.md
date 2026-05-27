# Production Review — 2026-05-27

Revisión completa de todas las secciones de la plataforma antes de ir a producción.
Commits relevantes: `085ced2` → `9357bfe` en rama `dave`.

---

## 1. Seguridad — Credenciales en git history

**Problema:** Firebase Service Account private key y Resend API key estaban hardcodeados en `infra/docker/docker-compose.dev.yml` y presentes en todo el historial de git. GitHub Push Protection bloqueaba el push.

**Solución:**
- Se reescribió el historial con `git-filter-repo --replace-text` para redactar las 3 cadenas secretas de todos los commits
- Se sustituyeron las variables por referencias a env vars: `${FIREBASE_SERVICE_ACCOUNT_JSON}` y `${RESEND_API_KEY}`
- Se hizo force-push a la rama `dave`

**Acción pendiente del usuario:**
- Rotar la Firebase Service Account key del proyecto `piums-artista` (Google Cloud Console → IAM → Service Accounts → Keys)
- Rotar el Resend API key (resend.com → API Keys)

---

## 2. CI/CD — `.github/workflows/`

### `ci.yml`
| Problema | Fix |
|---|---|
| No se disparaba en tag pushes → imágenes web nunca tenían tags semver | Añadido `push: tags: ['v*.*.*']` al trigger |
| `web-admin` nunca se construía en CI | Añadido a matrix de lint y build |
| Contexto Docker incorrecto para `web-admin` (necesita raíz del monorepo) | Reemplazado matriz simple por `matrix.include` con `context` y `app_url` por servicio |
| `NEXT_PUBLIC_APP_URL` igual para todos los servicios | Cada entrada de matrix tiene su propio `app_url` (client/artist/admin) |
| `web-admin` usa `npm`, no `pnpm` | Pasos de instalación/build condicionales por servicio |

### `backend-deploy-prod.yml`
| Problema | Fix |
|---|---|
| Dominios `blue.piums.com` y `piums.com` | Reemplazados por `blue.piums.io` y `piums.io` |
| Solo verificaba imágenes de backend, no web apps | Añadidos `web-client`, `web-artist`, `web-admin` a la lista de verificación |
| `nginx.conf` no se copiaba al servidor | Añadido paso `scp nginx.conf` junto al `docker-compose.yml` |

### `deploy-staging.yml`
- `staging.piums.com` → `staging.piums.io`

### `deploy-prod.yml`
- **Deshabilitado.** Era copia exacta de `backend-deploy-prod.yml`. Al dispararlos simultáneamente en el mismo release rompería el deploy blue-green (dos instancias compitiendo por el mismo servidor).

---

## 3. Docker Compose producción — `infra/docker/docker-compose.prod.yml`

| Problema | Fix |
|---|---|
| `web-client` mapeaba puerto host `3000:3000`, igual que `gateway` — colisión al arrancar | Cambiado a `3002:3000` |
| `web-admin` no existía como servicio | Añadido servicio `web-admin` (imagen `piums-web-admin:${IMAGE_TAG}`, puerto `3003:3003`) |
| `nginx` no estaba en Docker Compose → hostnames como `web-client:3000` no resolvían | Añadido servicio `nginx:1.25-alpine` con mounts del `nginx.conf`, certs Let's Encrypt y logs |

---

## 4. nginx — `infra/nginx/nginx.conf`

| Problema | Fix |
|---|---|
| `admin.piums.io` no tenía bloque HTTPS | Añadido upstream `web_admin` y server block completo para `admin.piums.io` |
| `client.piums.io` no estaba en ningún server_name | Añadido a bloque HTTP redirect y bloque HTTPS del cliente |
| No había location para Stripe webhooks | Ya estaba en bloque cliente; se mantiene sin rate limit y con `proxy_buffering off` |

**Acción pendiente del usuario:**
```bash
certbot certonly --webroot -w /var/www/certbot -d admin.piums.io
```

---

## 5. Kubernetes — `infra/k8s/`

| Problema | Fix |
|---|---|
| `kustomization.yaml` usaba `bases:` (deprecated en kustomize v4) | Cambiado a `resources:` |
| `secrets.yaml`: key name `FIREBASE_SERVICE_ACCOUNT_KEY` no coincidía con el código | Corregido a `FIREBASE_SERVICE_ACCOUNT_JSON` |
| Credenciales reales de Tilopay en el archivo | Reemplazadas por `CHANGE_ME` |
| Faltaban secrets: `INTERNAL_SERVICE_SECRET`, `PAYMENT_TOKEN_KEY`, `STRIPE_PUBLISHABLE_KEY`, etc. | Añadidos |
| `configmap.yaml`: faltaban `CLIENT_APP_URL`, `ARTIST_APP_URL`, `ADMIN_APP_URL`, `ENABLE_EMAIL` | Añadidos |
| Chat-service Service sin `sessionAffinity: ClientIP` | Añadido (requerido para Socket.IO multi-réplica) |

---

## 6. Gateway — `apps/gateway/src/routes/index.ts`

| Problema | Fix |
|---|---|
| `/api/bands` no existía → app iOS no podía llamar endpoints de bandas | Añadido proxy → artists-service |
| `/api/payouts` y `/api/commissions` daban 404 | Añadidos proxies → payments-service |
| `/api/webhooks` necesitaba ir sin `authMiddleware` para Stripe | Añadido sin middleware de auth |
| `/api/reschedule-requests` no existía → botones "Aceptar/Rechazar cambio de fecha" daban 404 | Añadido proxy con split: `/confirm` público (links de email) y el resto protegido |

---

## 7. Web-client — `apps/web-client/web/`

| Archivo | Problema | Fix |
|---|---|---|
| `src/app/booking/page.tsx` | Disponibilidad de marzo hardcodeada como fallback (scaffolding de dev en producción) | Eliminadas funciones `buildMarchAvailability`, `isMarchDate`, `injectFallbackSlots` |
| `src/app/search/page.tsx` | `sortBy` nunca se enviaba a la API; valores de categoría incorrectos (`'musica'` en vez de `'MUSICO'`) | Fijos ambos |
| `src/app/bookings/[id]/page.tsx` | `STATUS_MAP` faltaba: `DELIVERED`, `CANCELLED_CLIENT`, `CANCELLED_ARTIST`, `PAYMENT_PENDING`, `RESCHEDULED`, etc. | Añadidos todos |
| `src/app/booking/confirmation/[id]/page.tsx` | Siempre mostraba "Reserva Confirmada" aunque el pago estuviera pendiente | Muestra estado correcto según `paymentStatus` |
| `src/app/chat/page.tsx` | Typing indicator aparecía en todas las conversaciones | Filtrado por `conversationId` |
| `apps/web-client/web/Dockerfile` | `NEXT_PUBLIC_APP_URL` hardcodeado a `localhost` | Convertido a ARG/ENV |
| `package.json` | Flag `--webpack` inválido en script `build` | Eliminado |
| API routes auth/register | Cookie `maxAge: 3600` (1 hora) → usuarios se deslogueaban en onboarding | Cambiado a `604800` (7 días) |

---

## 8. Web-artist — `apps/web-artist/web/`

| Archivo | Problema | Fix |
|---|---|---|
| `src/app/artist/onboarding/page.tsx` | Sub-step de banda nunca aparecía: key `'musico'` en vez de `'musician'` | Corregida la key |
| `src/app/artist/dashboard/settings/page.tsx` | `sdk.getCalendarStatus()` sin `.catch()` → unhandled promise rejection en error de red | Añadido `.catch(() => {})` |
| `src/app/artist/dashboard/bookings/page.tsx` | Fetch de reschedule-requests sin `.catch()` → botones silenciosos en error | Añadido `.catch()` con toast de error |
| `src/app/artist/dashboard/postulaciones/page.tsx` | `handleApplicationRespond` sin try-catch → crash silencioso | Envuelto en try-catch con alert |
| `src/app/api/bands/openings/[oid]/apply/route.ts` | No existía → auditions page llamaba `/apply` que caía al gateway fallback sin Bearer token → 401 | Creado BFF route |
| API routes auth/register | Mismo problema de cookie 1h que web-client | Corregido a 7 días |

---

## 9. Web-admin — `apps/web-admin/web/`

Revisado y sin bugs críticos. Arquitectura correcta:
- Next.js rewrites proxean `/api/*` → gateway via `GATEWAY_INTERNAL_URL`
- Auth con sessionStorage + cookie de sesión para middleware Edge
- Role check `data.user.role !== "admin"` en login y en contexto
- Inactivity timeout de 30 min, expiry warning a los 5 min antes del JWT

**Dockerfile:** eliminada línea duplicada `USER node` que sobreescribía `USER nextjs`.

---

## 10. Servicios backend

| Servicio | Problema | Fix |
|---|---|---|
| `auth-service/middleware/authenticate.ts` | `req.jti` nunca se seteaba → logout no podía revocar tokens por JTI | Añadido `(req as any).jti = decoded.jti` |
| `booking-service/schemas/booking.schema.ts` | Enum `BookingStatusEnum` faltaba `DELIVERED`, `RESCHEDULED`, `RESCHEDULE_PENDING_*` → validación fallaba | Añadidos |
| `payments-service/providers/stripe.provider.ts` | Sin warning si `STRIPE_WEBHOOK_SECRET` no está configurado | Añadido warning al arranque |

---

## 11. SDK — `packages/sdk/src/types.ts`

Interfaces actualizadas para reflejar los campos reales que devuelve el backend:

- `Service`: añadidos `isMainService`, `isOnSale`, `currency`, `whatIsIncluded`, `pricingType`, `status`
- `Booking`: añadidos `serviceId`, `paymentStatus`, `scheduledDate`, `durationMinutes`, `location`, `clientNotes`, `totalPrice`, `servicePrice`, `addonsPrice`, `anticipoRequired`, `anticipoAmount`
- `BookingStatus` enum: añadidos todos los estados que usa el backend

---

## 12. Env vars — Secretos de GitHub Actions necesarios

Para que CI construya las imágenes correctamente, configurar en **Settings → Secrets → Actions**:

| Secret | Valor |
|---|---|
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | `BC9q3ezyHhjl0G7a7AJU8Az_CH4-tQc4-ENArfGrO5gEer-nSF7RjJYmmCR213XvPnlC9R6gqGnLf3VmkfVjJjU` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Tu clave real de Stripe (`pk_live_...` o `pk_test_...`) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `REDACTED_FIREBASE_API_KEY` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `piums-artista.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `piums-artista` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `piums-artista.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `967320828042` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:967320828042:web:ab90c17f49a99feb5a1573` |

---

## 13. Checklist para subir a producción

- [ ] Rotar Firebase Service Account key (proyecto `piums-artista`)
- [ ] Rotar Resend API key
- [ ] Agregar todos los GitHub Secrets listados arriba
- [ ] Emitir cert Let's Encrypt para `admin.piums.io`: `certbot certonly --webroot -w /var/www/certbot -d admin.piums.io`
- [ ] Agregar `client.piums.io` al cert existente o usar wildcard `*.piums.io`
- [ ] Configurar `PRODUCTION_ENV_FILE` secret en GitHub con todas las vars de producción (JWT_SECRET, REDIS_PASSWORD, POSTGRES_*, CLOUDINARY_*, STRIPE_*, etc.)
- [ ] Merge rama `dave` → `main` y publicar release para disparar `backend-deploy-prod.yml`
