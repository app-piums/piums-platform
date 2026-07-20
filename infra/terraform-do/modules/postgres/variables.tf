variable "environment" {
  type = string
}

variable "region" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "engine_version" {
  type = string
}

variable "size" {
  type = string
}

variable "node_count" {
  type = number
}

variable "databases" {
  type = list(string)
}

variable "k8s_cluster_id" {
  type = string
}
