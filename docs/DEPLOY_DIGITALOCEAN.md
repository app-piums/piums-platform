# Despliegue en DigitalOcean (DOKS + servicios gestionados)

Guía completa para levantar la plataforma Piums en **DigitalOcean Kubernetes
(DOKS)** con **Postgres y Redis gestionados**. Reemplaza al camino AWS
(`infra/terraform/`, sin usar) y al de Droplet+compose.

## Arquitectura

```
Cloudflare (TLS, DNS, WAF)
      │  HTTPS → HTTP
      ▼
DO Load Balancer  ──►  ingress-nginx (DOKS)
                              │
        ┌─────────────────────┼──────────────────────┐
        ▼                     ▼                        ▼
   gateway (x3)        12 microservicios         web-client/artist/admin
        │                     │                   (opcional en DOKS o en Cloudflare Pages)
        └─────────┬───────────┘
                  ▼
   ┌──────────────────────────┐   ┌───────────────────────┐
   │ Postgres gestionado (VPC) │   │ Redis gestionado (VPC) │
   │ 11 bases, 1 por servicio  │   │ TLS obligatorio (25061)│
   └──────────────────────────┘   └───────────────────────┘

Imágenes: ghcr.io/app-piums/piums-platform/<svc>  (las publica backend-ci.yml)
Backups:  DO Spaces (opcional)      Media: Cloudinary (sin cambios)
```

Decisiones clave:
- **Una base lógica por microservicio** (`piums_auth`, `piums_users`, ...). El
  overlay `production-do` cablea el `DATABASE_URL` de cada uno a su base.
- **Redis exige TLS**: el código ahora lo activa con `REDIS_TLS=true` (o esquema
  `rediss://` para moderation). Ver "Notas" abajo.
- **TLS lo termina Cloudflare** y reenvía HTTP al LB de DO (igual que hoy). No se
  usa cert-manager salvo que se quite Cloudflare.

## Prerrequisitos

- Cuenta DO con facturación activa.
- Herramientas locales: `doctl`, `kubectl`, `terraform >= 1.7`.
  ```bash
  brew install doctl kubectl
  brew tap hashicorp/tap && brew install hashicorp/tap/terraform
  ```
- `doctl auth init` con un Personal Access Token (read+write).
- Un PAT de GitHub con `read:packages` (para que DOKS baje imágenes de GHCR).

---

## Paso 1 — Provisionar la infraestructura (terraform)

```bash
cd infra/terraform-do
cp terraform.tfvars.example terraform.tfvars   # editar valores
export TF_VAR_do_token="dop_v1_..."            # o ponerlo en el tfvars

# (Opcional) estado remoto en Spaces: descomentar el backend en versions.tf.
terraform init
terraform plan -out tf.plan
terraform apply tf.plan
```

Esto crea: VPC, cluster DOKS (autoscale 3–6 nodos), Postgres gestionado con las
11 bases, Redis gestionado, firewalls que sólo permiten al cluster, y (opcional)
el bucket de backups en Spaces.

Recoge las conexiones para el Secret:
```bash
terraform output -json database_urls | jq          # una URL por base
terraform output pg_private_host
terraform output redis_host
terraform output redis_port
terraform output redis_password                     # sensitive
terraform output redis_url                          # rediss:// para moderation
```

> **Redis 'redis' vs 'valkey'**: cuentas DO nuevas sólo ofrecen `valkey` (compatible
> con el protocolo Redis; la app no cambia). Verificar con
> `doctl databases options engines` y ajustar `redis_engine`/`redis_engine_version`.

## Paso 2 — kubeconfig

```bash
doctl kubernetes cluster kubeconfig save "$(terraform output -raw cluster_name)"
kubectl config current-context      # debe apuntar a do-...-piums-prod
kubectl get nodes
```

## Paso 3 — Crear el Secret `piums-secrets` (fuera de banda)

El overlay **no** commitea secretos: borra el placeholder de la base y espera que
este Secret ya exista.

```bash
kubectl create namespace piums --dry-run=client -o yaml | kubectl apply -f -

cp infra/k8s/overlays/production-do/secrets.production.example.yaml /tmp/piums-secrets.yaml
# Rellenar:
#  - Los *_DATABASE_URL con `terraform output -json database_urls` (host privado,
#    ?sslmode=require). El host es el mismo para las 11; cambia el nombre de la base.
#  - REDIS_HOST/REDIS_PORT/REDIS_PASSWORD/REDIS_TLS=true y REDIS_URL (rediss://).
#  - JWT/OAuth/Tilopay/Stripe/Cloudinary/Firebase/Email con valores REALES.

kubectl apply -f /tmp/piums-secrets.yaml
shred -u /tmp/piums-secrets.yaml        # borra el archivo con secretos
```

## Paso 4 — ingress-nginx + metrics-server + LB de DO

```bash
# ingress-nginx (crea el DO Load Balancer automáticamente)
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.3/deploy/static/provider/cloud/deploy.yaml

# metrics-server (lo necesita el HPA)
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Anotaciones del LB de DO (nombre, PROXY protocol, healthcheck)
kubectl patch svc ingress-nginx-controller -n ingress-nginx \
  --type merge --patch-file infra/k8s/ingress-nginx/service-patch-do.yaml

# Si activaste PROXY protocol en el patch, habilitarlo también en el controller:
kubectl patch configmap ingress-nginx-controller -n ingress-nginx \
  --type merge -p '{"data":{"use-proxy-protocol":"true"}}'

# IP pública del LB (para el DNS)
kubectl get svc ingress-nginx-controller -n ingress-nginx -w
```

## Paso 5 — Pull secret de GHCR

```bash
kubectl -n piums create secret docker-registry ghcr \
  --docker-server=ghcr.io \
  --docker-username=<usuario-github> \
  --docker-password=<PAT read:packages>

kubectl -n piums patch serviceaccount piums-app -p '{"imagePullSecrets":[{"name":"ghcr"}]}'
kubectl -n piums patch serviceaccount default   -p '{"imagePullSecrets":[{"name":"ghcr"}]}'
```
(Alternativa: hacer públicos los packages de GHCR y saltar este paso.)

## Paso 6 — Desplegar el backend

```bash
# Validar el build del overlay antes de aplicar
kubectl kustomize infra/k8s/overlays/production-do | less

kubectl apply -k infra/k8s/overlays/production-do

# Fijar las imágenes al tag de release (en vez de :latest)
TAG=v1.0.0
for svc in gateway auth-service users-service artists-service catalog-service \
           booking-service payments-service reviews-service notifications-service \
           search-service chat-service moderation-service; do
  kubectl -n piums set image deployment/$svc $svc=ghcr.io/app-piums/piums-platform/$svc:$TAG
done

kubectl -n piums rollout status deployment/gateway
```

## Paso 7 — Aplicar el schema (una vez, y tras cambios de modelo)

El deployment pisa el CMD del contenedor, así que **ningún prisma corre al
arrancar**. Hay que aplicar el schema a mano con los pods ya arriba:

```bash
for svc in auth-service users-service artists-service catalog-service \
           booking-service payments-service reviews-service notifications-service \
           search-service chat-service moderation-service; do
  echo "== $svc =="
  kubectl -n piums exec deployment/$svc -- npx prisma db push --skip-generate
done
```
(Si algún servicio tiene seed idempotente, correrlo después.)

## Paso 8 — DNS y TLS (Cloudflare)

1. Apuntar en Cloudflare, **proxied (naranja)**, a la IP del LB:
   - `backend.piums.io`, `client.piums.io`, `artist.piums.io`, `admin.piums.io`,
     `piums.io`, `www.piums.io` → A → IP del LB.
2. SSL/TLS mode: **Full** (Cloudflare descifra y reenvía HTTP; el `ingress.yaml`
   ya trae `ssl-redirect: "false"` para no entrar en loop 308).
3. `proxy-body-size: 100m` ya está en el ingress (subida de video). Subir el
   límite de Cloudflare al plan que soporte el tamaño de video.

## Paso 9 — Smoke tests

```bash
kubectl -n piums get pods
curl -fsS https://backend.piums.io/api/health/ping
# Chat/WebSocket, login, búsqueda de artistas, y una reserva de prueba.
```

---

## CI/CD

`.github/workflows/backend-deploy-doks.yml` automatiza los pasos 5–7 y 9. Se
dispara con un release publicado o `workflow_dispatch` (input `image_tag`, y
`run_schema=true` para el primer deploy).

Secrets de repo a configurar:

| Secret | Qué es |
|---|---|
| `DIGITALOCEAN_ACCESS_TOKEN` | PAT de DO (read+write) |
| `DOKS_CLUSTER_NAME` | `piums-prod` |
| `GHCR_PULL_USER` | usuario GitHub con `read:packages` |
| `GHCR_PULL_TOKEN` | PAT con `read:packages` |

El Secret `piums-secrets` (paso 3) se crea a mano una vez; el CI **no** lo toca.

## Rollback

```bash
kubectl -n piums rollout undo deployment/<svc>          # a la revisión anterior
# o volver a fijar el tag bueno:
kubectl -n piums set image deployment/<svc> <svc>=ghcr.io/app-piums/piums-platform/<svc>:<tag-bueno>
```

---

## Notas y trampas (leer antes de producir)

- **Redis TLS (cambio de código incluido)**: los 6 servicios que abren Redis
  (auth, booking, users, payments, chat, moderation) ahora activan TLS con
  `REDIS_TLS=true`. Sin ese flag, con un Redis gestionado la conexión falla y
  chat cae a adapter in-memory / los locks corren sin lock / la sesión de auth
  no es compartida entre réplicas. `rejectUnauthorized:false` es aceptable porque
  el tráfico va por la **red privada de la VPC**; para pinnear el CA, montar el
  `ca-certificate.crt` de DO y pasar `tls:{ca}`.
- **El overlay `production` viejo está incompleto** (mandaba todo a `piums_prod`,
  sin `PORT` ni health-probe del gateway). Usar **`production-do`**, no `production`.
- **Los defaults de `PORT` en payments/reviews/notifications/booking están
  cruzados** en el código; el overlay los fija (4005/4006/4007/4008). No quitar
  esos patches.
- **Schema siempre a mano** (paso 7): el deployment pisa el CMD y prisma no corre
  solo. `migrate deploy` hoy no sirve (P3005, migraciones decorativas).
- **Bloqueadores preexistentes** que conviene cerrar antes o junto al go-live
  (ver `PENDIENTES.md` §3 y §5): `category=OTRO` nunca se reindexa; `DELIVERED`
  no cierra a `COMPLETED`; iOS registra APNs y no FCM; puerto 8080/HSTS/8443 del
  audit de seguridad; Cloudflare 100MB vs multer 100MB (margen cero).
- **Webs (web-client/artist/admin)**: este runbook cubre el **backend** (12
  servicios). Las webs **no** están en los manifiestos k8s — hoy corren por Docker
  Compose apuntando al backend (`GATEWAY_INTERNAL_URL`). Plan para llevarlas a DOKS
  en el Anexo A (aún no implementado).

---

## Anexo A — Desplegar las webs en DOKS (PLAN, no implementado)

Las 3 webs son Next.js con **rutas BFF server-side** (`/api/story-video`,
`/api/portafolio/*`, proxy de Cloudinary `/api/img`), así que necesitan un
servidor Node (imagen `standalone`) — **no** sirven como estático en Cloudflare
Pages. Lo coherente con el backend es correrlas en el **mismo DOKS** detrás del
ingress. Pasos para implementarlo:

1. **Imágenes** (ya las construye `ci.yml` con el fix de contexto). Ojo al
   naming: las webs son `ghcr.io/app-piums/piums-web-{client,artist,admin}`
   (prefijo `piums-`), distinto de los servicios backend que son
   `ghcr.io/app-piums/piums-platform/<svc>`.

2. **Manifiestos nuevos** (p.ej. `infra/k8s/base/web.yaml`, agregado al
   `kustomization.yaml`), un Deployment + Service (ClusterIP) por web:

   | App | Puerto | Service | Host |
   |-----|--------|---------|------|
   | web-client | 3000 | web-client-service | client.piums.io |
   | web-artist | 3001 | web-artist-service | artist.piums.io |
   | web-admin  | 3003 | web-admin-service  | admin.piums.io |

   Env de runtime: `GATEWAY_INTERNAL_URL=http://gateway-service:3000` (SSR/BFF
   llega al gateway por DNS interno del cluster). Los `NEXT_PUBLIC_*` van
   horneados en build (build-args de `ci.yml`), no en runtime. Probe HTTP a `/`.

3. **Ingress**: agregar los 3 hosts al `ingress.yaml` (o un ingress aparte),
   cada host → su service. Conservar las anotaciones actuales (`proxy-body-size:
   100m` para la subida de video, websocket, sticky). backend.piums.io sigue
   apuntando al gateway.

4. **Overlay**: incluir los nuevos manifiestos en `production-do` con sus
   imágenes pinneadas por tag, y extender `backend-deploy-doks.yml` (o un
   workflow web) para `set image` de las 3 webs y esperar su rollout.

5. **DNS/TLS**: client/artist/admin.piums.io → misma IP del LB, proxied por
   Cloudflare (igual que backend.piums.io). El paso 8 ya los contempla.

Alternativa gestionada: **DO App Platform** (un componente por web desde la
imagen de GHCR) si no se quiere sumarlas al cluster. Decidido: por ahora solo el
plan; implementar cuando se priorice.
