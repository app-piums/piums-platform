data "digitalocean_kubernetes_versions" "this" {
  version_prefix = var.version_prefix
}

resource "digitalocean_kubernetes_cluster" "this" {
  name         = var.cluster_name
  region       = var.region
  version      = data.digitalocean_kubernetes_versions.this.latest_version
  vpc_uuid     = var.vpc_id
  auto_upgrade = true

  # Parches automáticos en la ventana de mantenimiento (madrugada GT).
  maintenance_policy {
    day        = "sunday"
    start_time = "08:00" # UTC ≈ 02:00 GT
  }

  node_pool {
    name       = "piums-worker"
    size       = var.node_size
    auto_scale = true
    min_nodes  = var.node_min
    max_nodes  = var.node_max

    labels = {
      "piums.io/pool" = "worker"
    }
  }
}
