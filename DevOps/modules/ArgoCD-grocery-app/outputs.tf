output "applications" {
  description = "Details of deployed ArgoCD applications"
  value = {
    database = {
      name       = "grocery-database"
      namespace  = var.database_namespace
      sync_wave  = 1
      chart_path = var.database_chart_path
    }
    backend = {
      name       = "grocery-backend"
      namespace  = var.backend_namespace
      sync_wave  = 2
      chart_path = var.backend_chart_path
    }
    client = {
      name       = "grocery-clint"
      namespace  = var.client_namespace
      sync_wave  = 3
      chart_path = var.client_chart_path
    }
  }
}

output "application_names" {
  description = "List of ArgoCD application names"
  value       = ["grocery-database", "grocery-backend", "grocery-clint"]
}

output "target_namespaces" {
  description = "List of application target namespaces"
  value       = [var.database_namespace, var.backend_namespace, var.client_namespace]
}

output "repo_url" {
  description = "Git repository URL configured for ArgoCD applications"
  value       = var.repo_url
}
