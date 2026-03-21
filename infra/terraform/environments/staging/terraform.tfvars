cloud_provider = "gcp"
environment    = "staging"
region         = "us-central1"
app_port       = 3000

db_instance_name     = "agent-exchange-db"
db_tier              = "db-f1-micro"
cache_instance_name  = "agent-exchange-cache"
cache_memory_size_gb = 1
min_instances        = 0
max_instances        = 3
cpu                  = "1"
memory_mb            = 512
