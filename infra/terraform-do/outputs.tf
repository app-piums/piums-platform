# ─────────────────────── Cluster ────────────────────────────────────────────
output "cluster_id" {
  description = "ID del cluster DOKS (para `doctl kubernetes cluster kubeconfig save`)"
  value       = module.doks.id
}

output "cluster_name" {
  description = "Nombre del cluster DOKS"
  value       = module.doks.name
}

output "cluster_endpoint" {
  description = "Endpoint del API server de DOKS"
  value       = module.doks.endpoint
}

# ─────────────────────── Conexiones para el Secret ──────────────────────────
# Pegar estos valores en el Secret piums-secrets (ver
# infra/k8s/overlays/production-do/secrets.production.example.yaml).
# Consultar con:  terraform output -json database_urls | jq

output "database_urls" {
  description = "Mapa base→URL (con host privado y sslmode=require) para cada microservicio"
  sensitive   = true
  value = {
    for db in var.databases : db => "${local.pg_base}/${db}?sslmode=require"
  }
}

output "pg_private_host" {
  description = "Host privado del Postgres gestionado"
  value       = module.postgres.private_host
}

output "pg_port" {
  description = "Puerto del Postgres gestionado"
  value       = module.postgres.port
}

output "redis_host" {
  description = "Host privado del Redis gestionado (para REDIS_HOST)"
  value       = module.redis.private_host
}

output "redis_port" {
  description = "Puerto del Redis gestionado (para REDIS_PORT, TLS)"
  value       = module.redis.port
}

output "redis_password" {
  description = "Password del Redis gestionado (para REDIS_PASSWORD)"
  value       = module.redis.password
  sensitive   = true
}

output "redis_url" {
  description = "URL rediss:// del Redis gestionado (para REDIS_URL de moderation)"
  value       = module.redis.private_uri
  sensitive   = true
}

# ─────────────────────── Spaces ─────────────────────────────────────────────
output "spaces_backups_bucket" {
  description = "Nombre del bucket de backups en Spaces (vacío si create_spaces_bucket=false)"
  value       = module.spaces.bucket_name
}
