output "private_host" {
  description = "Host privado (VPC) del cluster de cache"
  value       = digitalocean_database_cluster.redis.private_host
}

output "port" {
  value = digitalocean_database_cluster.redis.port
}

output "password" {
  value     = digitalocean_database_cluster.redis.password
  sensitive = true
}

output "private_uri" {
  description = "URI rediss:// por red privada (para REDIS_URL de moderation)"
  value       = digitalocean_database_cluster.redis.private_uri
  sensitive   = true
}
