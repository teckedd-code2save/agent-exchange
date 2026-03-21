output "app_url" {
  description = "Public URL of the deployed application"
  value       = module.compute.service_url
}

output "database_connection_string" {
  description = "Database connection string"
  value       = module.database.connection_string
  sensitive   = true
}

output "database_instance_ip" {
  description = "Database instance IP"
  value       = module.database.instance_ip
}

output "redis_url" {
  description = "Redis connection URL"
  value       = module.cache.redis_url
  sensitive   = true
}
