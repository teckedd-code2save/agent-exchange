cloud_provider = "gcp"
environment    = "local"
region         = "us-central1"
app_image      = "agent-exchange:dev"
app_port       = 3000

# Local dev uses Docker Compose — no cloud resources provisioned
# Run: docker compose -f infra/docker/docker-compose.yml up -d
db_instance_name     = "agent-exchange-db"
cache_instance_name  = "agent-exchange-cache"
cache_memory_size_gb = 1
db_password          = "postgres"
min_instances        = 0
max_instances        = 1
