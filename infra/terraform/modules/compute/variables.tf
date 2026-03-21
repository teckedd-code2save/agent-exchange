variable "image_url" {
  description = "Container image URL"
  type        = string
}

variable "port" {
  description = "Port the container listens on"
  type        = number
  default     = 3000
}

variable "env_vars" {
  description = "Environment variables for the container"
  type        = map(string)
  sensitive   = true
  default     = {}
}

variable "cpu" {
  description = "CPU allocation"
  type        = string
  default     = "1"
}

variable "memory_mb" {
  description = "Memory in MB"
  type        = number
  default     = 512
}

variable "min_instances" {
  description = "Minimum instances"
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Maximum instances"
  type        = number
  default     = 10
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
