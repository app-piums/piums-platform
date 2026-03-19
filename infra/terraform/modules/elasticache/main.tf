resource "aws_elasticache_subnet_group" "main" {
  name        = "piums-redis-subnet-${var.environment}"
  subnet_ids  = var.private_subnets
  description = "Piums ElastiCache subnet group"
}

resource "aws_security_group" "redis" {
  name        = "piums-redis-sg-${var.environment}"
  description = "Allow Redis from EKS only"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id = "piums-redis-${var.environment}"
  description          = "Piums Redis cluster"

  node_type            = var.node_type
  port                 = 6379
  num_cache_clusters   = var.environment == "production" ? 2 : 1

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  automatic_failover_enabled = var.environment == "production"
  multi_az_enabled           = var.environment == "production"

  snapshot_retention_limit = 3
  snapshot_window          = "03:00-04:00"

  tags = { Name = "piums-redis-${var.environment}" }
}
