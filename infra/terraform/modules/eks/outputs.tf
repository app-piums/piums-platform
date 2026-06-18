output "cluster_endpoint"          { value = aws_eks_cluster.main.endpoint }
output "cluster_name"              { value = aws_eks_cluster.main.name }
output "cluster_ca_data"           { value = aws_eks_cluster.main.certificate_authority[0].data }
output "nginx_lb_security_group_id" { value = aws_security_group.nginx_lb.id }
