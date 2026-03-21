output "redis_url" {
  description = "Redis connection URL"
  value = var.cloud_provider == "gcp" ? (
    "redis://${google_redis_instance.main[0].host}:${google_redis_instance.main[0].port}"
  ) : (
    "redis://${aws_elasticache_replication_group.main[0].primary_endpoint_address}:6379"
  )
  sensitive = true
}
