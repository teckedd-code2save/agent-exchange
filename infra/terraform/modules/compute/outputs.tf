output "service_url" {
  description = "Public URL of the compute service"
  value       = var.cloud_provider == "gcp" ? google_cloud_run_v2_service.app[0].uri : "https://${aws_lb.app[0].dns_name}"
}
