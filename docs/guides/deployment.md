# Guía de Despliegue — Piums Platform

Índice corto. Los procedimientos completos viven en los dos runbooks:

- **Backend** → [`../DEPLOY_DIGITALOCEAN.md`](../DEPLOY_DIGITALOCEAN.md)
- **Frontends** → [`../DEPLOY_VERCEL.md`](../DEPLOY_VERCEL.md)

## Qué corre dónde

| Pieza | Dónde | Cómo se despliega |
|---|---|---|
| 11 microservicios + gateway | DigitalOcean Kubernetes (DOKS, `do-nyc3-piums-prod`) | Workflow `backend-deploy-doks.yml` |
| Postgres y Redis/Valkey | Servicios gestionados de DO, fuera del cluster | Terraform (`infra/terraform-do`) |
| web-client, web-artist, web-admin | Vercel | Push a `main` (auto-deploy por proyecto) |
| Entrada HTTP | Cloudflare → ingress-nginx del cluster → `gateway-service` | `infra/k8s/overlays/production-do` |

No hay ambiente de staging. El flujo es `feature/*` → PR → `main`.

## Backend, en corto

1. Un tag `v*` dispara `backend-ci.yml`, que publica las imágenes en GHCR.
2. Publicar el release (o lanzar `backend-deploy-doks.yml` a mano con el
   `image_tag`) aplica `infra/k8s/overlays/production-do` sobre el cluster.
3. El Secret `piums-secrets` **no** viaja en el repo: se aplica fuera de banda
   a partir de `infra/k8s/overlays/production-do/secrets.production.example.yaml`
   con los outputs de Terraform. Ver el runbook.

## Frontends, en corto

Cada web es un proyecto de Vercel apuntando a este monorepo, con un
`buildCommand` que compila `@piums/sdk` desde la raíz (ver el `vercel.json` de
cada app). Solo `main` despliega a producción; las ramas generan previews.

## Despliegue manual (emergencias)

```bash
# Aplicar el overlay de producción completo
kubectl --context do-nyc3-piums-prod apply -k infra/k8s/overlays/production-do

# Solo un servicio
kubectl -n piums set image deployment/auth-service \
  auth-service=ghcr.io/app-piums/piums-auth-service:NEW_TAG
```

## Migraciones de base de datos

Ojo: hoy los Dockerfile caen a `prisma db push` en el arranque, así que el SQL
de `prisma/migrations` no se aplica solo. Los cambios que `db push` no cubre
(índices únicos, columnas `tsvector`, extensiones) se aplican a mano contra la
base gestionada antes del rollout. Ver `DEPLOY_DIGITALOCEAN.md`.

## Rollback

```bash
# Backend
kubectl -n piums rollout history deployment/gateway
kubectl -n piums rollout undo deployment/gateway
kubectl -n piums rollout undo deployment/gateway --to-revision=3
```

Webs: promover el deployment anterior desde el panel de Vercel.

## Secretos en GitHub Actions

Configurar en `Settings > Secrets and variables > Actions`:

| Nombre | Descripción |
|--------|-------------|
| `DIGITALOCEAN_ACCESS_TOKEN` | Token de DO con acceso al cluster |
| `DOKS_CLUSTER_NAME` | Nombre del cluster (`piums-prod`) |
| `GHCR_PULL_USER` / `GHCR_PULL_TOKEN` | Credenciales del `imagePullSecret` para bajar las imágenes de GHCR |

Los secretos de la aplicación (bases, JWT, Stripe/Tilopay, Firebase) no van en
GitHub Actions: viven en el Secret `piums-secrets` del namespace `piums`.

## Monitoreo post-deploy

```bash
kubectl -n piums rollout status deployment/gateway
kubectl -n piums get pods
kubectl -n piums logs -f deployment/auth-service
kubectl -n piums describe pod <pod-name>
```
