output "private_host" {
  description = "Host privado (VPC) del cluster Postgres"
  value       = digitalocean_database_cluster.pg.private_host
}

output "port" {
  value = digitalocean_database_cluster.pg.port
}

output "user" {
  description = "Usuario admin por defecto (doadmin)"
  value       = digitalocean_database_cluster.pg.user
}

output "password" {
  value     = digitalocean_database_cluster.pg.password
  sensitive = true
}
