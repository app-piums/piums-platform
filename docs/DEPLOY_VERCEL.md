# Despliegue de los frontends en Vercel

Migra las 3 webs Next.js (`web-client`, `web-artist`, `web-admin`) de Docker+nginx
a **Vercel**, apuntando al backend ya en producción en DOKS (`https://backend.piums.io`).

## Decisiones

- **Repo fuente:** el monorepo principal `app-piums/piums-platform` (NO el mirror
  PIUMS-FRONTEND, que estaba desactualizado ~40 días con 8+ proyectos duplicados).
  Fuente única, deploy automático, preview URLs.
- **Uploads grandes:** van directo al backend (el BFF de Vercel corta en ~4.5MB).
  Ver "Paso 3".
- Cuenta Vercel: plan Hobby (suficiente para arrancar).

## Estado del repo (ya hecho, commit `81ba1ae`)

- `vercel.json` en las 3 apps (build monorepo-aware: sube a la raíz, instala el
  workspace, compila `@piums/sdk` y luego la app). El SDK NO se commitea compilado
  y no tiene `prepare`, por eso el build lo compila explícito.
- `web-artist/next.config.ts`: `output: 'standalone'` gateado a `DOCKER_BUILD`
  (en Vercel se compila normal; NO poner `DOCKER_BUILD`).
- Quitado `web-admin/web/package-lock.json` (npm dentro de workspace pnpm).

---

## Paso 1 — Limpiar el mirror y crear los 3 proyectos

1. En Vercel, **borrar los proyectos viejos** `piums-frontend-web*` (Settings →
   Advanced → Delete) y quitar la conexión al repo PIUMS-FRONTEND.
2. Instalar la **Vercel GitHub App** en `app-piums/piums-platform` (Vercel →
   Add New → Project → Import → dar acceso al repo).
3. Crear **3 proyectos** (Add New → Project, mismo repo, uno por app):

| Proyecto | Root Directory | Production Branch |
|---|---|---|
| `piums-web-client` | `apps/web-client/web` | `main` |
| `piums-web-artist` | `apps/web-artist/web` | `main` |
| `piums-web-admin`  | `apps/web-admin/web`  | `main` |

Framework = Next.js. El `vercel.json` de cada carpeta ya define install/build; no
tocar los comandos. NO marcar "Include files outside root directory" manualmente —
el `vercel.json` ya sube a la raíz.

---

## Paso 2 — Variables de entorno (por proyecto)

Settings → Environment Variables (marcar Production + Preview). Los `NEXT_PUBLIC_*`
se hornean en build (un cambio requiere redeploy).

### Comunes a client y artist (runtime, del lado servidor — mapeo probado en dev-compose)
```
GATEWAY_INTERNAL_URL = https://backend.piums.io
GATEWAY_URL          = https://backend.piums.io/api
AUTH_SERVICE_URL     = https://backend.piums.io/api
USERS_SERVICE_URL    = https://backend.piums.io
BOOKING_SERVICE_URL  = https://backend.piums.io
HTTPS_ENABLED        = true
CLOUDINARY_CLOUD_NAME = dumqooqjv        # confirmar que es el cloud real de Piums
```
### Solo web-artist (además de lo de arriba)
```
ARTISTS_SERVICE_URL  = https://backend.piums.io/api
CATALOG_API_URL      = https://backend.piums.io/api/catalog/services
# Rutas menores (suggest-synonym, categories) — el dev-compose no las mapeaba;
# añadir solo si se usan, verificando la ruta del gateway:
# SEARCH_SERVICE_URL   = https://backend.piums.io/api
# CATALOG_SERVICE_URL  = https://backend.piums.io
```
### NEXT_PUBLIC_* (build-time) — client y artist
```
NEXT_PUBLIC_API_URL              = /api
NEXT_PUBLIC_CHAT_SERVICE_URL     = https://backend.piums.io
NEXT_PUBLIC_APP_URL              = https://client.piums.io   # artist: https://artist.piums.io
NEXT_PUBLIC_CLIENT_URL           = https://client.piums.io
NEXT_PUBLIC_ARTIST_URL           = https://artist.piums.io
NEXT_PUBLIC_ADMIN_URL            = https://admin.piums.io
NEXT_PUBLIC_FIREBASE_API_KEY             = AIzaSyChoNjHVlq3iW3lWfoa9iObrQmFOLgRvPo
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN         = piums-artista.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID          = piums-artista
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET      = piums-artista.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 967320828042
NEXT_PUBLIC_FIREBASE_APP_ID              = 1:967320828042:web:ab90c17f49a99feb5a1573
NEXT_PUBLIC_FIREBASE_VAPID_KEY           = BC9q3ezyHhjl0G7a7AJU8Az_CH4-tQc4-ENArfGrO5gEer-nSF7RjJYmmCR213XvPnlC9R6gqGnLf3VmkfVjJjU
```
### Solo web-client (además)
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_...   # ← el real de Stripe (no está en el repo)
```
### Solo web-admin (mínimo)
```
GATEWAY_INTERNAL_URL         = https://backend.piums.io
NEXT_PUBLIC_CHAT_SERVICE_URL = https://backend.piums.io
NEXT_PUBLIC_API_URL          = /api
NEXT_PUBLIC_APP_URL          = https://admin.piums.io
```
Nunca poner secretos de backend (Cloudinary API secret, JWT, DB) en Vercel.

---

## Paso 3 — Uploads grandes fuera del BFF (cambio de código, pendiente)

Las funciones serverless de Vercel cortan el body en ~4.5MB. Las rutas BFF multipart
(web-artist: `story-video`, `portafolio/video|upload`, `bands/[id]/avatar`, avatar/
cover/documents; web-client: `users/me/avatar`, `users/documents/upload`) reenvían
el archivo al backend, que hace la subida real a Cloudinary. En Vercel esas rutas se
rompen. Solución: el navegador sube **directo a `https://backend.piums.io/api/...`**
(con `Authorization: Bearer`), sin pasar por el BFF. El ingress ya acepta 100MB.
Requiere además que `ALLOWED_ORIGINS` del backend incluya los dominios de las apps
(hoy ya están client/artist.piums.io). Ver seguimiento en el plan.

---

## Paso 4 — Probar en `*.vercel.app`

Cada proyecto genera una URL `*.vercel.app`. Validar antes de tocar dominios:
- Build verde (instala workspace, compila `@piums/sdk`, luego la app).
- Home carga; login (200, cookie `auth_token` Secure); datos públicos del SDK
  (search/catálogo) responden vía el rewrite → backend.
- Un upload chico funciona; uno grande (video) requiere el Paso 3.

---

## Paso 5 — Corte de dominios (Cloudflare)

`client/artist/admin.piums.io` hoy son **túneles** de Cloudflare al backend viejo.
Por cada uno, tras validar en `*.vercel.app`:
1. En el proyecto Vercel → Settings → Domains → agregar `client.piums.io` (etc.).
   Vercel indica el registro DNS a crear.
2. En Cloudflare DNS: borrar el CNAME al túnel y crear **CNAME →
   `cname.vercel-dns.com`** en **DNS-only** (nube gris; Vercel gestiona el TLS).
   El apex `piums.io` (si sirve client) va por A-record de Vercel o CNAME-flattening.
3. Esperar el "Valid Configuration" en Vercel y probar `https://client.piums.io`.

El backend viejo (Docker) queda de respaldo hasta confirmar estabilidad.

---

## Paso 6 — Limpieza posterior

- `.github/workflows/ci.yml`: quitar el job `build-images` de las 3 webs (Vercel ya
  despliega; deja de construir/pushear imágenes GHCR de las webs).
- Sacar las webs de `docker-compose.prod.yml` y del `nginx.conf` cuando el corte
  esté estable.
- Limpiar hostnames huérfanos de los túneles.
- Archivar/ignorar el mirror PIUMS-FRONTEND (ya no es fuente de deploy).
- Reconciliar `AGENT.md` (documenta dominios `.com` obsoletos; el real es `.io`).
