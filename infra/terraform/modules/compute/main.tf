# ─── GCP: Cloud Run v2 ───────────────────────────────────────────────────────

resource "google_cloud_run_v2_service" "app" {
  count    = var.cloud_provider == "gcp" ? 1 : 0
  name     = "agent-exchange-${var.environment}"
  location = var.region
  project  = var.gcp_project_id

  template {
    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    containers {
      image = var.image_url

      ports {
        container_port = var.port
      }

      resources {
        limits = {
          cpu    = var.cpu
          memory = "${var.memory_mb}Mi"
        }
      }

      dynamic "env" {
        for_each = var.env_vars
        content {
          name  = env.key
          value = env.value
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }
}

resource "google_cloud_run_v2_service_iam_member" "public" {
  count    = var.cloud_provider == "gcp" ? 1 : 0
  project  = var.gcp_project_id
  location = var.region
  name     = google_cloud_run_v2_service.app[0].name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ─── AWS: ECS + ALB ──────────────────────────────────────────────────────────

resource "aws_lb" "app" {
  count              = var.cloud_provider == "aws" ? 1 : 0
  name               = "agent-exchange-${var.environment}"
  internal           = false
  load_balancer_type = "application"
}

resource "aws_ecs_cluster" "app" {
  count = var.cloud_provider == "aws" ? 1 : 0
  name  = "agent-exchange-${var.environment}"
}

resource "aws_ecs_task_definition" "app" {
  count                    = var.cloud_provider == "aws" ? 1 : 0
  family                   = "agent-exchange-${var.environment}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = tostring(var.memory_mb)

  container_definitions = jsonencode([{
    name  = "app"
    image = var.image_url
    portMappings = [{
      containerPort = var.port
      protocol      = "tcp"
    }]
    environment = [
      for k, v in var.env_vars : { name = k, value = v }
    ]
  }])
}

resource "aws_ecs_service" "app" {
  count           = var.cloud_provider == "aws" ? 1 : 0
  name            = "agent-exchange-${var.environment}"
  cluster         = aws_ecs_cluster.app[0].id
  task_definition = aws_ecs_task_definition.app[0].arn
  desired_count   = var.min_instances > 0 ? var.min_instances : 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = []
    assign_public_ip = true
  }
}
