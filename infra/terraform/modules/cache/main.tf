# ─── GCP: Memorystore (Redis) ─────────────────────────────────────────────────

resource "google_redis_instance" "main" {
  count          = var.cloud_provider == "gcp" ? 1 : 0
  name           = "${var.instance_name}-${var.environment}"
  memory_size_gb = var.memory_size_gb
  region         = var.region
  project        = var.gcp_project_id
  redis_version  = "REDIS_7_0"

  labels = {
    environment = var.environment
    app         = "agent-exchange"
  }
}

# ─── AWS: ElastiCache ────────────────────────────────────────────────────────

resource "aws_elasticache_replication_group" "main" {
  count                      = var.cloud_provider == "aws" ? 1 : 0
  replication_group_id       = "${var.instance_name}-${var.environment}"
  description                = "Agent Exchange Redis cache (${var.environment})"
  node_type                  = "cache.t3.micro"
  num_cache_clusters         = var.environment == "production" ? 2 : 1
  port                       = 6379
  automatic_failover_enabled = var.environment == "production"

  tags = {
    Environment = var.environment
    App         = "agent-exchange"
  }
}
