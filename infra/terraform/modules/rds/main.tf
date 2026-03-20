resource "aws_db_subnet_group" "main" {
  name        = "piums-db-subnet-${var.environment}"
  subnet_ids  = var.private_subnets
  description = "Piums RDS subnet group"
}

resource "aws_security_group" "rds" {
  name        = "piums-rds-sg-${var.environment}"
  description = "Allow PostgreSQL from EKS only"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
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

resource "aws_db_instance" "main" {
  identifier              = "piums-postgres-${var.environment}"
  engine                  = "postgres"
  engine_version          = "16"
  instance_class          = var.db_instance_class
  allocated_storage       = 20
  max_allocated_storage   = 100
  storage_encrypted       = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  deletion_protection = var.environment == "production"
  skip_final_snapshot = var.environment != "production"
  final_snapshot_identifier = var.environment == "production" ? "piums-final-snapshot" : null

  performance_insights_enabled = true

  tags = { Name = "piums-postgres-${var.environment}" }
}
