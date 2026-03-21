variable "cloud_provider" {
  description = "Cloud provider to deploy to. Options: gcp | aws"
  type        = string
  default     = "gcp"

  validation {
    condition     = contains(["gcp", "aws"], var.cloud_provider)
    error_message = "cloud_provider must be 'gcp' or 'aws'."
  }
}

variable "environment" {
  description = "Deployment environment. Options: local | staging | production"
  type        = string
  default     = "staging"
}

variable "app_image" {
  description = "Docker image URL for the web app"
  type        = string
}

variable "app_port" {
  description = "Port the app listens on"
  type        = number
  default     = 3000
}

variable "region" {
  description = "Region for compute, database, and cache"
  type        = string
  default     = "us-central1"
}

variable "db_instance_name" {
  description = "Database instance name"
  type        = string
  default     = "agent-exchange-db"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "agent_exchange"
}

variable "db_user" {
  description = "Database user"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "db_tier" {
  description = "Database instance tier (GCP: db-f1-micro etc)"
  type        = string
  default     = "db-f1-micro"
}

variable "cache_instance_name" {
  description = "Redis cache instance name"
  type        = string
  default     = "agent-exchange-cache"
}

variable "cache_memory_size_gb" {
  description = "Redis memory size in GB"
  type        = number
  default     = 1
}

variable "min_instances" {
  description = "Minimum compute instances"
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Maximum compute instances"
  type        = number
  default     = 10
}

variable "cpu" {
  description = "CPU allocation per instance"
  type        = string
  default     = "1"
}

variable "memory_mb" {
  description = "Memory per instance in MB"
  type        = number
  default     = 512
}

variable "app_env_vars" {
  description = "Environment variables for the app container"
  type        = map(string)
  sensitive   = true
  default     = {}
}

variable "gcp_project_id" {
  description = "GCP project ID"
  type        = string
  default     = ""
}
