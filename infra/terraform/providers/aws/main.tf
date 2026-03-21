# AWS provider configuration
# Resources: ECS Fargate + ALB, RDS Postgres 15, ElastiCache Redis

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type    = string
  default = "production"
}

variable "app_image" {
  type = string
}

variable "db_password" {
  type      = string
  sensitive = true
}
