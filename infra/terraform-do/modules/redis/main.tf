resource "digitalocean_database_cluster" "redis" {
  name                 = "piums-${var.environment}-${var.engine}"
  engine               = var.engine
  version              = var.engine_version
  size                 = var.size
  region               = var.region
  node_count           = 1
  private_network_uuid = var.vpc_id

  # DO evacúa por LRU cuando se llena la cache (Socket.IO adapter, locks, sesiones).
  eviction_policy = "allkeys_lru"
}

resource "digitalocean_database_firewall" "redis_fw" {
  cluster_id = digitalocean_database_cluster.redis.id

  rule {
    type  = "k8s"
    value = var.k8s_cluster_id
  }
}
