# ─────────────────────── Credenciales DO ────────────────────────────────────
variable "do_token" {
  description = "DigitalOcean API token (Personal Access Token con scope de escritura)"
  type        = string
  sensitive   = true
}

variable "spaces_access_id" {
  description = "Spaces access key ID (para crear el bucket de backups). Distinto del API token."
  type        = string
  sensitive   = true
  default     = ""
}

variable "spaces_secret_key" {
  description = "Spaces secret key"
  type        = string
  sensitive   = true
  default     = ""
}

# ─────────────────────── Generales ──────────────────────────────────────────
variable "environment" {
  description = "Entorno (staging | production)"
  type        = string
  default     = "production"
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment debe ser 'staging' o 'production'."
  }
}

variable "region" {
  description = "Región DO (nyc3/sfo3/ams3/fra1/sgp1). nyc3 es la más cercana a GT con Spaces disponible."
  type        = string
  default     = "nyc3"
}

# ─────────────────────── VPC ────────────────────────────────────────────────
variable "vpc_ip_range" {
  description = "Rango CIDR privado de la VPC"
  type        = string
  default     = "10.10.0.0/16"
}

# ─────────────────────── DOKS ───────────────────────────────────────────────
variable "cluster_name" {
  description = "Nombre del cluster DOKS"
  type        = string
  default     = "piums-prod"
}

variable "k8s_version_prefix" {
  description = "Prefijo de versión de Kubernetes; se resuelve a la última parche disponible (p.ej. '1.31.')"
  type        = string
  default     = "1.31."
}

variable "node_size" {
  description = "Slug del droplet de los nodos worker"
  type        = string
  default     = "s-2vcpu-4gb"
}

variable "node_min" {
  description = "Mínimo de nodos (autoscaler)"
  type        = number
  default     = 3
}

variable "node_max" {
  description = "Máximo de nodos (autoscaler)"
  type        = number
  default     = 6
}

# ─────────────────────── Postgres gestionado ────────────────────────────────
variable "pg_engine_version" {
  description = "Versión mayor de PostgreSQL"
  type        = string
  default     = "16"
}

variable "pg_size" {
  description = "Slug del nodo del cluster Postgres gestionado"
  type        = string
  default     = "db-s-1vcpu-2gb"
}

variable "pg_node_count" {
  description = "Nodos del cluster Postgres (1 = primario; 2+ agrega standby HA)"
  type        = number
  default     = 1
}

variable "databases" {
  description = "Bases lógicas, una por microservicio"
  type        = list(string)
  default = [
    "piums_auth",
    "piums_users",
    "piums_artists",
    "piums_catalog",
    "piums_bookings",
    "piums_payments",
    "piums_reviews",
    "piums_notifications",
    "piums_search",
    "piums_chat",
    "piums_moderation",
  ]
}

# ─────────────────────── Redis gestionado ───────────────────────────────────
variable "redis_engine" {
  description = "Motor: 'redis' o 'valkey'. Cuentas DO nuevas usan 'valkey' (compatible con el protocolo Redis; no requiere cambios en la app). Verificar con: doctl databases options engines"
  type        = string
  default     = "redis"
}

variable "redis_engine_version" {
  description = "Versión del motor de cache (redis '7' | valkey '8')"
  type        = string
  default     = "7"
}

variable "redis_size" {
  description = "Slug del nodo del cluster de cache gestionado"
  type        = string
  default     = "db-s-1vcpu-1gb"
}

# ─────────────────────── Spaces (backups) ───────────────────────────────────
variable "spaces_bucket_name" {
  description = "Nombre global-único del bucket de backups en Spaces"
  type        = string
  default     = "piums-prod-backups"
}

variable "create_spaces_bucket" {
  description = "Crear el bucket de backups en Spaces (requiere spaces_access_id/secret_key)"
  type        = bool
  default     = false
}
