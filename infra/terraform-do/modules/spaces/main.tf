# Bucket de backups (opcional: requiere Spaces keys). Media sigue en Cloudinary.
resource "digitalocean_spaces_bucket" "backups" {
  count  = var.create ? 1 : 0
  name   = var.bucket_name
  region = var.region
  acl    = "private"
}
