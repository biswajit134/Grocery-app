locals {
  namespaces = var.create_namespaces ? {
    (var.database_namespace) = {
      name            = var.database_namespace
      istio_injection = "enabled"
    }
    (var.backend_namespace) = {
      name            = var.backend_namespace
      istio_injection = "enabled"
    }
    (var.client_namespace) = {
      name            = var.client_namespace
      istio_injection = "enabled"
    }
  } : {}
}

# Pre-provision application namespaces with Istio sidecar injection enabled
resource "kubernetes_namespace_v1" "app_namespaces" {
  for_each = local.namespaces

  metadata {
    name = each.value.name
    labels = {
      name            = each.value.name
      istio-injection = each.value.istio_injection
    }
  }
}

# 1. Database Tier (Sync-Wave 1: MongoDB StatefulSet & Redis Deployment)
resource "kubectl_manifest" "grocery_database_app" {
  yaml_body = templatefile("${path.module}/templates/application.yaml.tpl", {
    app_name              = "grocery-database"
    argocd_namespace      = var.argocd_namespace
    tier                  = "database"
    sync_wave             = "1"
    repo_url              = var.repo_url
    target_revision       = var.target_revision
    chart_path            = var.database_chart_path
    destination_namespace = var.database_namespace
    enable_auto_sync      = var.enable_auto_sync
    enable_self_heal      = var.enable_self_heal
    enable_prune          = var.enable_prune
  })

  depends_on = [
    kubernetes_namespace_v1.app_namespaces
  ]
}

# 2. Backend Microservices Tier (Sync-Wave 2: Auth, Product, Order, Gateway)
resource "kubectl_manifest" "grocery_backend_app" {
  yaml_body = templatefile("${path.module}/templates/application.yaml.tpl", {
    app_name              = "grocery-backend"
    argocd_namespace      = var.argocd_namespace
    tier                  = "backend"
    sync_wave             = "2"
    repo_url              = var.repo_url
    target_revision       = var.target_revision
    chart_path            = var.backend_chart_path
    destination_namespace = var.backend_namespace
    enable_auto_sync      = var.enable_auto_sync
    enable_self_heal      = var.enable_self_heal
    enable_prune          = var.enable_prune
  })

  depends_on = [
    kubernetes_namespace_v1.app_namespaces,
    kubectl_manifest.grocery_database_app
  ]
}

# 3. Frontend Client Apps Tier (Sync-Wave 3: Admin, Delivery Partner, Frontend, Vendor)
resource "kubectl_manifest" "grocery_client_app" {
  yaml_body = templatefile("${path.module}/templates/application.yaml.tpl", {
    app_name              = "grocery-clint"
    argocd_namespace      = var.argocd_namespace
    tier                  = "client"
    sync_wave             = "3"
    repo_url              = var.repo_url
    target_revision       = var.target_revision
    chart_path            = var.client_chart_path
    destination_namespace = var.client_namespace
    enable_auto_sync      = var.enable_auto_sync
    enable_self_heal      = var.enable_self_heal
    enable_prune          = var.enable_prune
  })

  depends_on = [
    kubernetes_namespace_v1.app_namespaces,
    kubectl_manifest.grocery_backend_app
  ]
}
