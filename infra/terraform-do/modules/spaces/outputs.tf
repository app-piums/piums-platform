output "bucket_name" {
  description = "Nombre del bucket de backups (vacío si no se creó)"
  value       = var.create ? digitalocean_spaces_bucket.backups[0].name : ""
}
