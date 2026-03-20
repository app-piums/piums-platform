terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.27"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.13"
    }
  }

  backend "s3" {
    bucket         = "piums-terraform-state"
    key            = "piums-platform/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "piums-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "piums-platform"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# ─────────────────────── Modules ────────────────────────────────────────────

module "vpc" {
  source      = "./modules/vpc"
  environment = var.environment
  aws_region  = var.aws_region
  vpc_cidr    = var.vpc_cidr
}

module "eks" {
  source          = "./modules/eks"
  environment     = var.environment
  cluster_name    = var.eks_cluster_name
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnet_ids
  node_instance_type = var.eks_node_instance_type
  node_desired_size  = var.eks_node_desired_size
  node_min_size      = var.eks_node_min_size
  node_max_size      = var.eks_node_max_size

  depends_on = [module.vpc]
}

module "rds" {
  source          = "./modules/rds"
  environment     = var.environment
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnet_ids
  db_name         = var.db_name
  db_username     = var.db_username
  db_password     = var.db_password
  db_instance_class = var.rds_instance_class

  depends_on = [module.vpc]
}

module "elasticache" {
  source          = "./modules/elasticache"
  environment     = var.environment
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnet_ids
  node_type       = var.redis_node_type

  depends_on = [module.vpc]
}

module "s3" {
  source      = "./modules/s3"
  environment = var.environment
  bucket_prefix = var.s3_bucket_prefix
}
