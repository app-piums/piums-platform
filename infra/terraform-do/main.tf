provider "digitalocean" {
  token             = var.do_token
  spaces_access_id  = var.spaces_access_id
  spaces_secret_key = var.spaces_secret_key
}

# ─────────────────────── Módulos ────────────────────────────────────────────

module "vpc" {
  source      = "./modules/vpc"
  environment = var.environment
  region      = var.region
  ip_range    = var.vpc_ip_range
}

module "doks" {
  source         = "./modules/doks"
  cluster_name   = var.cluster_name
  region         = var.region
  vpc_id         = module.vpc.id
  version_prefix = var.k8s_version_prefix
  node_size      = var.node_size
  node_min       = var.node_min
  node_max       = var.node_max
}

module "postgres" {
  source         = "./modules/postgres"
  environment    = var.environment
  region         = var.region
  vpc_id         = module.vpc.id
  engine_version = var.pg_engine_version
  size           = var.pg_size
  node_count     = var.pg_node_count
  databases      = var.databases
  k8s_cluster_id = module.doks.id
}

module "redis" {
  source         = "./modules/redis"
  environment    = var.environment
  region         = var.region
  vpc_id         = module.vpc.id
  engine         = var.redis_engine
  engine_version = var.redis_engine_version
  size           = var.redis_size
  k8s_cluster_id = module.doks.id
}

module "spaces" {
  source      = "./modules/spaces"
  create      = var.create_spaces_bucket
  bucket_name = var.spaces_bucket_name
  region      = var.region
}

# ─────────────────────── Cadenas de conexión derivadas ──────────────────────
# El Postgres gestionado usa el HOST PRIVADO (VPC) → latencia baja y sin cargo
# de ancho de banda entre el cluster y la base.
locals {
  pg_userinfo = "${module.postgres.user}:${module.postgres.password}"
  pg_base     = "postgresql://${local.pg_userinfo}@${module.postgres.private_host}:${module.postgres.port}"
}
