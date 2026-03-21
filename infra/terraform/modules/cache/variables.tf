variable "instance_name" {
  description = "Cache instance name"
  type        = string
}

variable "memory_size_gb" {
  description = "Redis memory size in GB"
  type        = number
  default     = 1
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
