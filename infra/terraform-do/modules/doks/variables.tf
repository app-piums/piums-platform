variable "cluster_name" {
  type = string
}

variable "region" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "version_prefix" {
  type = string
}

variable "node_size" {
  type = string
}

variable "node_min" {
  type = number
}

variable "node_max" {
  type = number
}
