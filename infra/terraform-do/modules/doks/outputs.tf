output "id" {
  description = "ID del cluster DOKS (sirve como trusted source 'k8s' en los firewalls de DB)"
  value       = digitalocean_kubernetes_cluster.this.id
}

output "name" {
  value = digitalocean_kubernetes_cluster.this.name
}

output "endpoint" {
  value = digitalocean_kubernetes_cluster.this.endpoint
}

output "kube_config_raw" {
  description = "kubeconfig crudo (preferir `doctl kubernetes cluster kubeconfig save` en la práctica)"
  value       = digitalocean_kubernetes_cluster.this.kube_config[0].raw_config
  sensitive   = true
}
