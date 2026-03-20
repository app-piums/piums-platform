# Guía de Despliegue — Piums Platform

## Ambientes

| Ambiente | Branch | URL | Trigger |
|----------|--------|-----|---------|
| Desarrollo | cualquier | localhost | manual |
| Staging | develop | staging.piums.app | push a develop |
| Producción | main | api.piums.app | push a main |

## Pre-requisitos

- Acceso a AWS con permisos EKS + ECR + RDS
- `kubectl` configurado con el cluster de staging/produción
- `helm` v3
- Secretos en GitHub Actions configurados (ver sección de Secretos)

## Despliegue Staging (automático)

Cada push a `develop` dispara el workflow `deploy-staging.yml`:

1. Build de imágenes Docker para todos los servicios
2. Push a GitHub Container Registry (`ghcr.io/app-piums/...`)
3. Aplicar manifiestos Kubernetes (`kubectl apply -k infra/k8s/overlays/staging`)
4. Esperar rollout con health checks
5. Notificación en Slack del resultado

## Despliegue Producción (manual + automático)

Push a `main` dispara `deploy-prod.yml`:

1. Los mismos pasos que staging (con tag `:latest`)
2. Requiere aprobación manual en GitHub Actions (environment protection)
3. Aplica `infra/k8s/overlays/production`

## Despliegue manual (emergencias)

```bash
# Staging
kubectl apply -k infra/k8s/overlays/staging

# Producción
kubectl apply -k infra/k8s/overlays/production

# Solo un servicio
kubectl set image deployment/auth-service \
  auth-service=ghcr.io/app-piums/piums-platform/auth-service:NEW_TAG \
  -n piums
```

## Migraciones de base de datos

Las migraciones deben ejecutarse **antes** del rollout:

```bash
# Staging (desde CI)
./scripts/migrate.sh staging

# Producción (manual antes del deploy)
./scripts/migrate.sh production
```

El script hace backup automático antes de cada migración en producción.

## Rollback

```bash
# Ver historial de deployments
kubectl rollout history deployment/gateway -n piums

# Rollback al estado anterior
kubectl rollout undo deployment/gateway -n piums

# Rollback a versión específica
kubectl rollout undo deployment/gateway --to-revision=3 -n piums
```

## Infraestructura (Terraform)

Primera vez — provisionar desde cero:

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Editar terraform.tfvars con los valores reales

terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

Actualizar infraestructura existente:

```bash
terraform plan -out=tfplan   # Revisar cambios
terraform apply tfplan
```

## Secretos en GitHub Actions

Configurar en `Settings > Secrets and variables > Actions`:

| Nombre | Descripción |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials |
| `KUBE_CONFIG_STAGING` | kubeconfig de staging (base64) |
| `KUBE_CONFIG_PROD` | kubeconfig de producción (base64) |
| `GHCR_TOKEN` | GitHub token con permisos `packages:write` |
| `DB_PASSWORD` | PostgreSQL master password |
| `JWT_SECRET` | JWT signing secret |
| `STRIPE_SECRET_KEY` | Stripe API key |
| `SLACK_WEBHOOK_URL` | Notificaciones de deploy |

## Monitoreo post-deploy

```bash
# Estado del rollout
kubectl rollout status deployment/gateway -n piums

# Pods corriendo
kubectl get pods -n piums

# Logs de un servicio
kubectl logs -f deployment/auth-service -n piums

# Describir pod con problemas
kubectl describe pod <pod-name> -n piums
```
