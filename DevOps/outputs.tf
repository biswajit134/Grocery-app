output "cluster_name" {
  description = "The name of the created kind cluster."
  value       = module.kind_cluster.cluster_name
}

output "endpoint" {
  description = "The Kubernetes API server endpoint."
  value       = module.kind_cluster.endpoint
}

output "kubeconfig_path" {
  description = "Path to the generated kubeconfig file."
  value       = module.kind_cluster.kubeconfig_path
}

output "cilium_version" {
  description = "The deployed version of Cilium."
  value       = module.cilium.cilium_version
}

output "hubble_ui_url" {
  description = "URL to access the Hubble UI."
  value       = "http://localhost:31005/"
}

output "kubectl_hint" {
  description = "Command hint to set KUBECONFIG for your current session."
  value       = "Run this: $$env:KUBECONFIG=\"${module.kind_cluster.kubeconfig_path}\""
}

output "client_apps" {
  description = "URLs to access the grocery client applications (HTTPS with TLS)."
  value = {
    frontend         = "https://localhost:31000/"
    admin            = "https://localhost:31000/admin"
    vendor           = "https://localhost:31000/vendor"
    delivery_partner = "https://localhost:31000/delivery-partner"
  }
}

output "argocd_url" {
  description = "URL to access ArgoCD."
  value       = "http://localhost:31006/"
}

output "observability_urls" {
  description = "URLs to access observability dashboards."
  value       = module.observability.urls
}

output "argocd_apps" {
  description = "ArgoCD applications for the GroceryHub stack."
  value       = module.argocd_grocery_app.applications
}

output "vault_url" {
  description = "URL to access HashiCorp Vault Web UI."
  value       = module.vault.vault_ui_url
}

output "root_ca_cert_pem" {
  description = "The Root CA certificate PEM for trusting in browser and OS."
  value       = module.istio_gateway.root_ca_cert_pem
}

