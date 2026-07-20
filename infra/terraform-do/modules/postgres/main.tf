resource "digitalocean_database_cluster" "pg" {
  name                 = "piums-${var.environment}-pg"
  engine               = "pg"
  version              = var.engine_version
  size                 = var.size
  region               = var.region
  node_count           = var.node_count
  private_network_uuid = var.vpc_id
}

# Una base lógica por microservicio (piums_auth, piums_users, ...).
resource "digitalocean_database_db" "dbs" {
  for_each   = toset(var.databases)
  cluster_id = digitalocean_database_cluster.pg.id
  name       = each.value
}

# Sólo el cluster DOKS puede alcanzar la base (red privada VPC + firewall).
resource "digitalocean_database_firewall" "pg_fw" {
  cluster_id = digitalocean_database_cluster.pg.id

  rule {
    type  = "k8s"
    value = var.k8s_cluster_id
  }
}
