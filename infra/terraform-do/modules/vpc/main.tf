resource "digitalocean_vpc" "this" {
  name     = "piums-${var.environment}-vpc"
  region   = var.region
  ip_range = var.ip_range
}
