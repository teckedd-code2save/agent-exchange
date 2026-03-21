output "connection_string" {
  description = "PostgreSQL connection string"
  value = var.cloud_provider == "gcp" ? (
    "postgresql://${var.db_user}:${var.db_password}@${google_sql_database_instance.main[0].public_ip_address}:5432/${var.db_name}"
  ) : (
    "postgresql://${var.db_user}:${var.db_password}@${aws_db_instance.main[0].endpoint}/${var.db_name}"
  )
  sensitive = true
}

output "instance_ip" {
  description = "Database instance IP"
  value = var.cloud_provider == "gcp" ? (
    google_sql_database_instance.main[0].public_ip_address
  ) : (
    aws_db_instance.main[0].address
  )
}
