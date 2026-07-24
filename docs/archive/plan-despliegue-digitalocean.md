# Plan de Despliegue en DigitalOcean — Piums Platform (Producción)

> **Actualizado 2026-06-09.** Versión anterior asumía migración desde AWS. La realidad: producción corre HOY en una máquina local (docker-compose) expuesta vía **Cloudflare Tunnel**. Este plan es el primer despliegue real a la nube e incluye migración de datos y corte de DNS.

## Resumen

Despliegue de la plataforma a **DigitalOcean Kubernetes (DOKS)**, reutilizando los manifests de `infra/k8s/` (backend) y las imágenes GHCR existentes. Incluye: infraestructura con Terraform, migración del Postgres local a Managed PostgreSQL, despliegue de las 3 webs Next.js (hoy solo cubiertas por docker-compose, no por K8s), y corte de DNS en Cloudflare manteniendo el túnel como rollback.

### Estado actual (punto de partida)

- Backend (gateway + 10 microservicios) y 3 webs corren en local con `docker-compose.prod.yml`, expuestos por `cloudflared` → `backend.piums.io` / `client.piums.io` responden sanos.
- Postgres y Redis: contenedores locales. **Los datos de producción viven en la máquina local** — son el activo crítico a migrar.
- Imágenes ya se publican a GHCR (`backend-ci.yml`).
- DNS gestionado en **Cloudflare**.
- `infra/k8s/base/` cubre solo backend; **faltan manifests para web-client, web-artist y web-admin**.

### Arquitectura objetivo

| Componente | Hoy (local + tunnel) | DigitalOcean (nuevo) |
|---|---|---|
| Orquestación | docker-compose local | **DOKS** (DigitalOcean Kubernetes) |
| Base de datos | Postgres en contenedor local | **DO Managed PostgreSQL** (HA, backups automáticos) |
| Cache | Redis en contenedor local | **DO Managed Redis** |
| Object Storage | — (media en Cloudinary, sigue igual) | **DO Spaces** (Terraform state + backups) |
| Entrada | Cloudflare Tunnel | **DO Load Balancer** (via nginx-ingress) + Cloudflare DNS |
| Container Registry | GHCR | **GHCR** (sin cambio) |
| CI/CD | GitHub Actions (SSH + compose) | **GitHub Actions (doctl + kubectl)** |

### Prerequisitos

1. Cuenta DigitalOcean con billing activo + API token (write).
2. CLI locales: `doctl`, `terraform >= 1.7`, `kubectl`, `helm`.
3. Acceso al panel de Cloudflare (DNS de piums.io).
4. Todas las imágenes (backend + webs) publicadas en GHCR con tag estable — verificar que las 3 webs también se construyen en CI.
5. `JWT_SECRET` y demás secretos definidos: **desde junio 2026 los servicios fallan al arrancar en producción si falta `JWT_SECRET`** (endurecimiento intencional).
6. Backup completo del Postgres local ANTES de empezar (`pg_dumpall`).

---

## Estimación de Costos Mensuales

| Recurso | Configuración | Costo/mes |
|---|---|---|
| DOKS — 3 nodos `s-4vcpu-8gb` | 12 vCPU, 24 GB RAM total | ~$144 |
| DO Managed PostgreSQL (HA) | `db-s-2vcpu-4gb` × 2 nodos | ~$100 |
| DO Managed Redis | `db-s-1vcpu-2gb` × 1 nodo | ~$15 |
| DO Load Balancer | `lb-small` | ~$12 |
| DO Spaces (100 GB) | Terraform state + backups | ~$5 |
| **Total estimado** | | **~$276/mes** |

> Los nodos DOKS pueden reducirse a `s-2vcpu-4gb` ($24/mes × 3 = $72) para ahorrar en inicio, con posibilidad de escalar con HPA.

### Configuración recomendada para arrancar (~$135/mes)

Para el volumen actual de la plataforma, empezar con: 3 nodos `s-2vcpu-4gb` ($72), **Managed PostgreSQL single-node `db-s-1vcpu-2gb` ($30)** — los backups diarios automáticos de DO cubren el riesgo mientras no haya tráfico que justifique HA — Redis managed mínimo ($15), LB small ($12) y Spaces ($5). Escalar a la configuración completa (~$276/mes) cuando haya tracción: subir Postgres a HA es un clic en el panel sin downtime. **Base de datos en contenedor dentro del cluster NO se recomienda**: el motivo principal de salir de la máquina local es no volver a tener los datos de producción en almacenamiento efímero.

---

## Archivos a Crear / Modificar

| Área | Archivo | Acción |
|---|---|---|
| Terraform | `infra/terraform-do/` | **CREAR** (nuevo directorio) |
| K8s Ingress | `infra/k8s/base/ingress.yaml` | **MODIFICAR** (anotaciones LB) |
| K8s cert-manager | `infra/k8s/base/cert-manager-issuer.yaml` | **CREAR** |
| K8s Secrets | `infra/k8s/base/secrets.yaml` | **MODIFICAR** (URLs de DO) |
| CI/CD prod | `.github/workflows/deploy-prod.yml` | **MODIFICAR** (doctl) |
| CI/CD prod backend | `.github/workflows/backend-deploy-prod.yml` | **MODIFICAR** (doctl) |

Los siguientes archivos **no requieren cambios**: todos los `deployments.yaml`, `services.yaml`, `hpa.yaml`, `namespace.yaml`, `configmap.yaml`, overlays de production.

---

## Fase 1 — Terraform para DigitalOcean

Crear `infra/terraform-do/` con la siguiente estructura:

```
infra/terraform-do/
├── main.tf
├── variables.tf
├── outputs.tf
└── modules/
    ├── doks/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── postgres/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── redis/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    └── spaces/
        ├── main.tf
        ├── variables.tf
        └── outputs.tf
```

### 1.1 Provider y Backend (`main.tf`)

```hcl
terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.40"
    }
  }

  # DO Spaces es S3-compatible — se usa como backend
  backend "s3" {
    endpoint                    = "https://nyc3.digitaloceanspaces.com"
    bucket                      = "piums-terraform-state"
    key                         = "piums-platform/terraform.tfstate"
    region                      = "us-east-1"     # valor ficticio, requerido por Terraform
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    force_path_style            = true
  }
}

provider "digitalocean" {
  token             = var.do_token
  spaces_access_id  = var.spaces_access_id
  spaces_secret_key = var.spaces_secret_key
}

module "spaces"   { source = "./modules/spaces"  region = var.region }
module "doks"     { source = "./modules/doks"    region = var.region  cluster_name = var.cluster_name }
module "postgres" { source = "./modules/postgres" region = var.region }
module "redis"    { source = "./modules/redis"    region = var.region }
```

### 1.2 Módulo DOKS — Cluster Kubernetes

```hcl
# modules/doks/main.tf
resource "digitalocean_kubernetes_cluster" "piums" {
  name    = var.cluster_name   # "piums-prod"
  region  = var.region         # "nyc3"
  version = "1.31"             # Última versión LTS disponible

  node_pool {
    name       = "worker-pool"
    size       = "s-4vcpu-8gb"
    auto_scale = true
    min_nodes  = 3
    max_nodes  = 8
    labels = {
      env = "production"
    }
  }
}
```

### 1.3 Módulo PostgreSQL Managed

```hcl
# modules/postgres/main.tf
resource "digitalocean_database_cluster" "postgres" {
  name       = "piums-postgres-prod"
  engine     = "pg"
  version    = "16"
  size       = "db-s-2vcpu-4gb"   # HA recomendado para producción
  region     = var.region
  node_count = 2                   # primary + standby automático

  maintenance_window {
    day  = "sunday"
    hour = "03:00:00"
  }
}

# 1 base de datos por microservicio
resource "digitalocean_database_db" "services" {
  for_each   = toset([
    "auth", "users", "artists", "catalog", "payments",
    "reviews", "notifications", "booking", "search", "chat"
  ])
  cluster_id = digitalocean_database_cluster.postgres.id
  name       = "piums_${each.key}"
}

# Firewall: solo el cluster DOKS puede conectarse
resource "digitalocean_database_firewall" "postgres" {
  cluster_id = digitalocean_database_cluster.postgres.id
  rule {
    type  = "k8s"
    value = var.doks_cluster_id
  }
}
```

### 1.4 Módulo Redis Managed

```hcl
# modules/redis/main.tf
resource "digitalocean_database_cluster" "redis" {
  name       = "piums-redis-prod"
  engine     = "redis"
  version    = "7"
  size       = "db-s-1vcpu-2gb"
  region     = var.region
  node_count = 1
}

resource "digitalocean_database_firewall" "redis" {
  cluster_id = digitalocean_database_cluster.redis.id
  rule {
    type  = "k8s"
    value = var.doks_cluster_id
  }
}
```

### 1.5 Módulo DO Spaces

```hcl
# modules/spaces/main.tf
resource "digitalocean_spaces_bucket" "terraform_state" {
  name   = "piums-terraform-state"
  region = var.region
  acl    = "private"
}

resource "digitalocean_spaces_bucket" "backups" {
  name   = "piums-backups"
  region = var.region
  acl    = "private"

  lifecycle_rule {
    enabled = true
    expiration { days = 30 }
  }
}
```

---

## Fase 2 — Kubernetes: Ajustes para DOKS

### 2.1 Actualizar `infra/k8s/base/ingress.yaml`

Agregar anotación para nombrar el Load Balancer de DO (se agrega al Service de nginx-ingress, no al Ingress resource):

```yaml
# Las anotaciones existentes se mantienen igual:
annotations:
  kubernetes.io/ingress.class: nginx
  cert-manager.io/cluster-issuer: letsencrypt-prod
  nginx.ingress.kubernetes.io/ssl-redirect: "true"
  nginx.ingress.kubernetes.io/proxy-body-size: 50m
  nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
  nginx.ingress.kubernetes.io/proxy-send-timeout: "300"
  nginx.ingress.kubernetes.io/proxy-http-version: "1.1"
  nginx.ingress.kubernetes.io/affinity: cookie
  nginx.ingress.kubernetes.io/session-cookie-name: PIUMS_ROUTE
  nginx.ingress.kubernetes.io/session-cookie-max-age: "172800"
  # Agregar upgrade headers para WebSocket:
  nginx.ingress.kubernetes.io/configuration-snippet: |
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
```

### 2.2 Crear `infra/k8s/base/cert-manager-issuer.yaml`

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: soporte@piums.io
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
```

### 2.3 Crear manifests para las 3 webs Next.js (NUEVO — hoy no existen)

`infra/k8s/base/` solo cubre el backend. Crear `web-deployments.yaml` con Deployment + Service para `web-client`, `web-artist` y `web-admin` (mismo patrón que los microservicios, imágenes `ghcr.io/app-piums/piums-web-*`), y añadir al `ingress.yaml` los hosts:

| Host | Service | Nota |
|---|---|---|
| **`piums.io`** | web-client:3000 | **Dominio final de la web de clientes (apex)** |
| `www.piums.io` | redirect 308 → `piums.io` | |
| `client.piums.io` | redirect 308 → `piums.io` | Transición; ver advertencia abajo |
| `artist.piums.io` | web-artist:3000 | |
| `admin.piums.io` | web-admin:3000 | |
| `backend.piums.io` | gateway:3000 | |

Variables clave: `GATEWAY_INTERNAL_URL=http://gateway:3000` (igual que en compose). Registrar los 3 nuevos deployments en `kustomization.yaml`.

### 2.4 Cambio de dominio: `client.piums.io` → `piums.io` (checklist obligatorio)

El cambio de dominio de la web de clientes NO es solo DNS. Actualizar:

1. **Apps móviles de Cliente**: `PiumsClienteAndroid` tiene `BASE_URL = "https://client.piums.io/"` hardcodeado en `build.gradle.kts`, y el iOS usa `client.piums.io` como fallback en `APIEndpoint.swift`. ⚠️ **No dejar que las apps dependan de un redirect**: los POST no siguen redirects de forma fiable. Cambiar las apps a `https://backend.piums.io/api/` (API directa) o mantener `client.piums.io` sirviendo la app (no redirect) hasta que las apps publicadas se actualicen.
2. **OAuth**: añadir `https://piums.io/auth/callback` a los redirect URIs autorizados en las consolas de Google, Facebook y TikTok (sin quitar los de `client.piums.io` hasta completar la transición). Actualizar `FRONTEND_URL` del auth-service.
3. **CORS**: añadir `https://piums.io` a los orígenes permitidos del gateway/servicios.
4. **Variables de entorno**: `NEXT_PUBLIC_*` y `.env.production` de web-client que referencien `client.piums.io`.
5. **Webhooks de pagos** (Stripe/Tilopay): si alguno apunta a `client.piums.io`, actualizarlo.
6. **SEO/links**: el redirect 308 de `client.piums.io` → `piums.io` se mantiene permanentemente (links viejos, emails enviados, QRs impresos).

---

## Fase 3 — GitHub Actions: Migrar a `doctl`

### Secrets a crear en GitHub (Settings → Secrets):

```
DO_ACCESS_TOKEN          # API token de DigitalOcean
DO_CLUSTER_NAME          # "piums-prod"
DO_SPACES_ACCESS_KEY     # Para Terraform state
DO_SPACES_SECRET_KEY     # Para Terraform state
```

### Cambio en `.github/workflows/deploy-prod.yml`

```yaml
# REEMPLAZAR:
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    ...

- name: Update kubeconfig
  run: aws eks update-kubeconfig --name piums-cluster --region us-east-1

# POR:
- name: Install doctl
  uses: digitalocean/action-doctl@v2
  with:
    token: ${{ secrets.DO_ACCESS_TOKEN }}

- name: Save DOKS kubeconfig
  run: doctl kubernetes cluster kubeconfig save ${{ secrets.DO_CLUSTER_NAME }}
```

---

## Fase 4 — Secrets de Kubernetes con URLs de DO

Actualizar `infra/k8s/base/secrets.yaml` con el formato de DO Managed Databases:

```yaml
# DO PostgreSQL — formato: postgresql://doadmin:<pass>@<host>:25060/<db>?sslmode=require
AUTH_DATABASE_URL: "postgresql://doadmin:CHANGEME@piums-postgres-prod.db.ondigitalocean.com:25060/piums_auth?sslmode=require"
USERS_DATABASE_URL: "postgresql://doadmin:CHANGEME@<host>:25060/piums_users?sslmode=require"
# ... (repetir para los 10 servicios)

# DO Redis — formato: rediss://default:<pass>@<host>:25061
REDIS_URL: "rediss://default:CHANGEME@piums-redis-prod.db.ondigitalocean.com:25061"

# DO Spaces (para backups) — API compatible con S3
AWS_ACCESS_KEY_ID: "<spaces-access-key>"
AWS_SECRET_ACCESS_KEY: "<spaces-secret>"
AWS_S3_ENDPOINT: "https://nyc3.digitaloceanspaces.com"
S3_BACKUP_BUCKET: "piums-backups"
```

> **Nota:** Los hosts y passwords exactos se obtienen del output de `terraform apply` o desde el panel de DigitalOcean.

---

## Fase 5 — Bootstrap del Cluster

Una vez que DOKS esté creado, ejecutar una sola vez:

```bash
# 1. Conectar al cluster
doctl kubernetes cluster kubeconfig save piums-prod

# 2. Instalar nginx-ingress controller
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace \
  --set controller.service.annotations."service\.beta\.kubernetes\.io/do-loadbalancer-name"=piums-lb \
  --set controller.service.annotations."service\.beta\.kubernetes\.io/do-loadbalancer-size-slug"=lb-small

# 3. Instalar cert-manager
helm repo add jetstack https://charts.jetstack.io
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace \
  --set installCRDs=true

# 4. Crear ClusterIssuer de Let's Encrypt
kubectl apply -f infra/k8s/base/cert-manager-issuer.yaml

# 5. Crear namespace y aplicar toda la plataforma
kubectl apply -k infra/k8s/overlays/production

# 6. Obtener la IP pública del Load Balancer
kubectl get svc -n ingress-nginx ingress-nginx-controller
# → Anotar la EXTERNAL-IP para DNS
```

---

## Fase 6 — Migración de Datos (Postgres local → DO Managed PostgreSQL)

**La fase más delicada: los datos de producción viven en tu máquina local.**

```bash
# 1. CONGELAR escrituras: poner la plataforma local en mantenimiento
#    (detener gateway o activar página de mantenimiento en nginx local)

# 2. Dump por cada base (desde la máquina local)
for db in piums_auth piums_users piums_artists piums_catalog piums_payments \
          piums_reviews piums_notifications piums_booking piums_search piums_chat piums_moderation; do
  docker exec piums-postgres-prod pg_dump -U piums -Fc $db > backup_$db.dump
done

# 3. Restaurar a DO Managed PG (host/credenciales del output de Terraform)
for db in ...; do
  pg_restore -h <do-pg-host> -p 25060 -U doadmin -d $db --no-owner --no-privileges backup_$db.dump
done

# 4. Verificar conteos de filas clave en ambos lados:
#    users, artists, bookings, payments, reviews — deben coincidir exactamente.

# 5. Ejecutar prisma migrate/db push solo si los schemas difieren
#    (las imágenes de los servicios corren `prisma generate` en build; verificar versión de schema)
```

> **Ventana de mantenimiento estimada: 30–60 min.** Hacerla en horario valle (madrugada GT). Redis no se migra (solo cache/sesiones — los usuarios re-loguean).

---

## Fase 7 — DNS en Cloudflare + Corte

El DNS está en **Cloudflare** y hoy apunta al túnel (`cloudflared`). El corte es editar los registros, no crear zona nueva:

| Dominio | Hoy | Nuevo valor |
|---|---|---|
| **`piums.io`** (apex) | (lo que tenga hoy) | **A → `<EXTERNAL-IP del DO LB>`** — web de clientes (dominio final) |
| `www.piums.io` | — | A → `<EXTERNAL-IP>` (redirect en ingress) |
| `backend.piums.io` | CNAME al tunnel | A → `<EXTERNAL-IP>` |
| `client.piums.io` | CNAME al tunnel | A → `<EXTERNAL-IP>` (redirect 308 → piums.io; mantener hasta actualizar apps móviles) |
| `artist.piums.io` | CNAME al tunnel | A → `<EXTERNAL-IP>` |
| `admin.piums.io` | CNAME al tunnel | A → `<EXTERNAL-IP>` |

**Importante con el proxy de Cloudflare (nube naranja):**
- Durante la emisión inicial de certificados Let's Encrypt (HTTP-01), poner los registros en **DNS only (nube gris)** para que cert-manager pueda validar. Una vez `READY=True`, puedes reactivar el proxy naranja (modo SSL **Full (strict)**).
- TTL bajo (300s) antes del corte para poder revertir rápido.

**Orden del corte:**
1. Cluster desplegado y verificado con `curl -H "Host: backend.piums.io" http://<EXTERNAL-IP>/api/health` (antes de tocar DNS).
2. Congelar escrituras local → migrar datos (Fase 6).
3. Cambiar DNS en Cloudflare.
4. Verificar salud + login + booking en producción nueva.
5. **NO apagar el túnel ni borrar los datos locales durante al menos 7 días** — son tu rollback.

**Rollback:** revertir los registros DNS al CNAME del túnel (propaga en minutos con TTL 300) y descongelar la plataforma local. Si hubo escrituras en DO post-corte, evaluar sync inverso antes de revertir.

---

## Orden de Ejecución Completo

```
── Preparación (sin tocar producción actual) ──────────────────────────────
Paso 1:  Backup completo del Postgres local (pg_dumpall) y guardarlo fuera de la máquina
Paso 2:  Verificar que CI publica imágenes de las 3 webs a GHCR (si no, añadirlas a backend-ci.yml)
Paso 3:  Crear manifests K8s de las webs (Fase 2.3)
Paso 4:  Crear DO Spaces bucket manualmente (una vez, para el Terraform state)
Paso 5:  cd infra/terraform-do && terraform init && terraform apply
Paso 6:  Anotar outputs: DB host, Redis host, passwords
Paso 7:  Actualizar infra/k8s/base/secrets.yaml con URLs reales y TODOS los secretos
         (JWT_SECRET obligatorio — los servicios fallan al arrancar sin él)
Paso 8:  doctl kubernetes cluster kubeconfig save piums-prod
Paso 9:  Instalar nginx-ingress + cert-manager (helm)
Paso 10: kubectl apply -f infra/k8s/base/cert-manager-issuer.yaml
Paso 11: kubectl apply -k infra/k8s/overlays/production
Paso 12: kubectl get pods -n piums → 0 CrashLoopBackOff
Paso 13: Probar contra la IP del LB sin DNS:
         curl -H "Host: backend.piums.io" http://<EXTERNAL-IP>/api/health

── Corte (ventana de mantenimiento, madrugada GT) ─────────────────────────
Paso 14: Congelar escrituras en la plataforma local
Paso 15: Migrar datos (Fase 6) y verificar conteos
Paso 16: Cloudflare: registros A → EXTERNAL-IP (nube gris hasta tener TLS)
Paso 17: kubectl get certificate -n piums → READY=True → reactivar proxy naranja (Full strict)
Paso 18: curl https://backend.piums.io/api/health + smoke test (login, booking, chat, pago de prueba)

── Post-corte ─────────────────────────────────────────────────────────────
Paso 19: Agregar secrets DO_ACCESS_TOKEN y DO_CLUSTER_NAME en GitHub
Paso 20: Actualizar .github/workflows/*deploy-prod.yml (doctl, Fase 3)
Paso 21: Push a main → verificar deploy automático exitoso
Paso 22: Mantener túnel + datos locales 7 días como rollback; luego apagar cloudflared
```

---

## Verificación End-to-End

- [ ] `terraform plan` sin errores en `infra/terraform-do/`
- [ ] `terraform apply` → cluster + PostgreSQL + Redis + Spaces creados
- [ ] `kubectl get nodes` → 3 nodos `Ready`
- [ ] `kubectl get pods -n piums` → todos `Running`, 0 `CrashLoopBackOff` (backend + 3 webs)
- [ ] Conteos de filas (users, artists, bookings, payments) idénticos local vs DO
- [ ] `kubectl get certificate -n piums` → `READY=True` (TLS activo)
- [ ] `curl https://backend.piums.io/api/health` → todos los servicios `up`
- [ ] `piums.io`, `artist.piums.io`, `admin.piums.io` cargan desde el cluster
- [ ] `client.piums.io` y `www.piums.io` redirigen (308) a `piums.io`
- [ ] OAuth con callback `piums.io` funciona (Google/Facebook/TikTok actualizados en sus consolas)
- [ ] Login, booking, chat y un pago de prueba funcionan correctamente
- [ ] Webhooks de Stripe/Tilopay apuntan al dominio correcto (verificar en sus dashboards)
- [ ] OAuth (Google/Facebook/TikTok): callbacks siguen siendo los mismos dominios → sin cambios
- [ ] Push a `main` → GitHub Actions deploy exitoso
- [ ] `kubectl rollout status deployment -n piums` → todas las réplicas activas
- [ ] Backups automáticos activos en DO Managed PG (panel → Backups)
- [ ] Día 7: apagar `cloudflared` local y archivar el último backup
