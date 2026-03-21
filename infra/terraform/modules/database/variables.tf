variable "instance_name" {
  description = "Database instance name"
  type        = string
}

variable "db_name" {
  description = "Database name"
  type        = string
}

variable "db_user" {
  description = "Database username"
  type        = string
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "tier" {
  description = "Instance tier (GCP: db-f1-micro | AWS: db.t3.micro)"
  type        = string
  default     = "db-f1-micro"
}

variable "region" {
  description = "Deployment region"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "cloud_provider" {
  description = "Cloud provider: gcp | aws"
  type        = string
}

variable "gcp_project_id" {
  description = "GCP project ID"
  type        = string
  default     = ""
}
