output "kiali_url" {
  description = "URL to access Kiali."
  value       = "http://localhost:${var.kiali_host_port}"
}

output "jaeger_url" {
  description = "URL to access Jaeger."
  value       = "http://localhost:${var.jaeger_host_port}"
}

output "prometheus_url" {
  description = "URL to access Prometheus."
  value       = "http://localhost:${var.prometheus_host_port}"
}

output "grafana_url" {
  description = "URL to access Grafana."
  value       = "http://localhost:${var.grafana_host_port}"
}

output "urls" {
  description = "URLs to access all observability dashboards."
  value = {
    kiali      = "http://localhost:${var.kiali_host_port}"
    jaeger     = "http://localhost:${var.jaeger_host_port}"
    prometheus = "http://localhost:${var.prometheus_host_port}"
    grafana    = "http://localhost:${var.grafana_host_port}"
  }
}
