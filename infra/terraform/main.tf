# Root module — delegates to provider-specific modules based on cloud_provider variable

locals {
  is_gcp = var.cloud_provider == "gcp"
  is_aws = var.cloud_provider == "aws"
}

# ─── GCP Provider ────────────────────────────────────────────────────────────

provider "google" {
  project = var.gcp_project_id
  region  = var.region
}

# ─── AWS Provider ────────────────────────────────────────────────────────────

provider "aws" {
  region = var.region
}

# ─── Compute Module ──────────────────────────────────────────────────────────

module "compute" {
  source = "./modules/compute"

  image_url      = var.app_image
  port           = var.app_port
  env_vars       = var.app_env_vars
  cpu            = var.cpu
  memory_mb      = var.memory_mb
  min_instances  = var.min_instances
  max_instances  = var.max_instances
  region         = var.region
  environment    = var.environment
  cloud_provider = var.cloud_provider
  gcp_project_id = var.gcp_project_id
}

# ─── Database Module ─────────────────────────────────────────────────────────

module "database" {
  source = "./modules/database"

  instance_name  = var.db_instance_name
  db_name        = var.db_name
  db_user        = var.db_user
  db_password    = var.db_password
  tier           = var.db_tier
  region         = var.region
  environment    = var.environment
  cloud_provider = var.cloud_provider
  gcp_project_id = var.gcp_project_id
}

# ─── Cache Module ────────────────────────────────────────────────────────────

module "cache" {
  source = "./modules/cache"

  instance_name  = var.cache_instance_name
  memory_size_gb = var.cache_memory_size_gb
  region         = var.region
  environment    = var.environment
  cloud_provider = var.cloud_provider
  gcp_project_id = var.gcp_project_id
}
