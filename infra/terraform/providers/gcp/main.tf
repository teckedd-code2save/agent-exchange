# GCP provider configuration
# Usage: terraform -chdir=infra/terraform apply -var-file=providers/gcp/vars.tfvars
#
# Resources:
# - Cloud Run v2      → compute module
# - Cloud SQL (PG15)  → database module (with pg_trgm enabled)
# - Memorystore Redis → cache module

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.region
}

variable "gcp_project_id" {
  type = string
}

variable "region" {
  type    = string
  default = "us-central1"
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
