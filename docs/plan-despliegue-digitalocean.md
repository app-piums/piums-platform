# Plan de Despliegue en DigitalOcean — Piums Platform (Producción)

## Resumen

Migración de la infraestructura de producción de AWS a **DigitalOcean**, manteniendo la arquitectura Kubernetes existente para maximizar estabilidad y reutilizar los manifests actuales con cambios mínimos.

### Arquitectura objetivo

| Componente | AWS (actual) | DigitalOcean (nuevo) |
|---|---|---|
| Kubernetes | EKS | **DOKS** (DigitalOcean Kubernetes) |
| Base de datos | RDS PostgreSQL | **DO Managed PostgreSQL** |
| Cache | ElastiCache Redis | **DO Managed Redis** |
| Object Storage | S3 | **DO Spaces** (API S3-compatible) |
| Load Balancer | ALB | **DO Load Balancer** (auto, via nginx-ingress) |
| Container Registry | GHCR | **GHCR** (sin cambio) |
| CI/CD | GitHub Actions (aws-cli) | **GitHub Actions (doctl)** |

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

> Los nodos DOKS pueden reducirse a `s-2vcpu-4gb` ($72/mes × 3 = $72) para ahorrar en inicio, con posibilidad de escalar con HPA.

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

## Fase 6 — DNS

Una vez obtenida la IP del Load Balancer de DO:

| Dominio | Tipo | Valor |
|---|---|---|
| `backend.piums.io` | A | `<EXTERNAL-IP>` |
| `api.piums.app` | A | `<EXTERNAL-IP>` |

Las apps web (`client.piums.io`, `artist.piums.io`, `admin.piums.io`) se mantienen donde están (Vercel / otro servidor). El backend es lo único que apunta al cluster DOKS.

---

## Orden de Ejecución Completo

```
Paso 1:  Crear DO Spaces bucket manualmente (una vez, para el Terraform state)
Paso 2:  cd infra/terraform-do && terraform init && terraform apply
Paso 3:  Anotar outputs: DB host, Redis host, passwords
Paso 4:  Actualizar infra/k8s/base/secrets.yaml con las URLs reales
Paso 5:  doctl kubernetes cluster kubeconfig save piums-prod
Paso 6:  Instalar nginx-ingress + cert-manager (helm)
Paso 7:  kubectl apply -f infra/k8s/base/cert-manager-issuer.yaml
Paso 8:  Actualizar infra/k8s/base/ingress.yaml (si falta alguna anotación)
Paso 9:  kubectl apply -k infra/k8s/overlays/production
Paso 10: kubectl get pods -n piums  →  verificar 0 CrashLoopBackOff
Paso 11: Obtener EXTERNAL-IP y apuntar DNS
Paso 12: curl https://backend.piums.io/api/health  →  {"status":"ok"}
Paso 13: Agregar secrets DO_ACCESS_TOKEN y DO_CLUSTER_NAME en GitHub
Paso 14: Actualizar .github/workflows/deploy-prod.yml  (doctl)
Paso 15: Push a main → verificar GitHub Action exitoso
```

---

## Verificación End-to-End

- [ ] `terraform plan` sin errores en `infra/terraform-do/`
- [ ] `terraform apply` → cluster + PostgreSQL + Redis + Spaces creados
- [ ] `kubectl get nodes` → 3 nodos `Ready`
- [ ] `kubectl get pods -n piums` → todos `Running`, 0 `CrashLoopBackOff`
- [ ] `kubectl get certificate -n piums` → `READY=True` (TLS activo)
- [ ] `curl https://backend.piums.io/api/health` → `{"status":"ok"}`
- [ ] Login, booking y chat funcionan correctamente
- [ ] Push a `main` → GitHub Actions deploy exitoso
- [ ] `kubectl rollout status deployment -n piums` → todas las replicas activas
