# ─── GCP: Cloud SQL (Postgres 15) ────────────────────────────────────────────

resource "google_sql_database_instance" "main" {
  count            = var.cloud_provider == "gcp" ? 1 : 0
  name             = "${var.instance_name}-${var.environment}"
  database_version = "POSTGRES_18"
  region           = var.region
  project          = var.gcp_project_id

  settings {
    tier = var.tier

    backup_configuration {
      enabled    = var.environment == "production"
      start_time = "02:00"
    }

    database_flags {
      name  = "pg_trgm.similarity_threshold"
      value = "0.3"
    }
  }

  deletion_protection = var.environment == "production"
}

resource "google_sql_database" "db" {
  count    = var.cloud_provider == "gcp" ? 1 : 0
  name     = var.db_name
  instance = google_sql_database_instance.main[0].name
  project  = var.gcp_project_id
}

resource "google_sql_user" "user" {
  count    = var.cloud_provider == "gcp" ? 1 : 0
  name     = var.db_user
  instance = google_sql_database_instance.main[0].name
  password = var.db_password
  project  = var.gcp_project_id
}

# ─── AWS: RDS Postgres 15 ────────────────────────────────────────────────────

resource "aws_db_instance" "main" {
  count                = var.cloud_provider == "aws" ? 1 : 0
  identifier           = "${var.instance_name}-${var.environment}"
  engine               = "postgres"
  engine_version       = "18"
  instance_class       = var.tier
  db_name              = var.db_name
  username             = var.db_user
  password             = var.db_password
  skip_final_snapshot  = var.environment != "production"
  deletion_protection  = var.environment == "production"
  publicly_accessible  = false

  backup_retention_period = var.environment == "production" ? 7 : 0
}
