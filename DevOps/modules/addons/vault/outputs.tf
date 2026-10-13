output "namespace" {
  description = "Namespace where Vault is deployed"
  value       = kubernetes_namespace_v1.vault.metadata[0].name
}

output "service_name" {
  description = "Vault service name"
  value       = "vault"
}

output "vault_server_url" {
  description = "Internal in-cluster URL for Vault"
  value       = "http://vault.${kubernetes_namespace_v1.vault.metadata[0].name}.svc.cluster.local:8200"
}

output "vault_ui_url" {
  description = "Host URL to access Vault UI"
  value       = "http://localhost:${var.vault_host_port}/"
}

output "vault_root_token" {
  description = "Vault dev root token"
  value       = var.vault_root_token
  sensitive   = true
}
