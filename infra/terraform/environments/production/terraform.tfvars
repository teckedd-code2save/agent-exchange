cloud_provider = "gcp"
environment    = "production"
region         = "us-central1"
app_port       = 3000

db_instance_name     = "agent-exchange-db"
db_tier              = "db-g1-small"
cache_instance_name  = "agent-exchange-cache"
cache_memory_size_gb = 2
min_instances        = 1
max_instances        = 20
cpu                  = "2"
memory_mb            = 1024
