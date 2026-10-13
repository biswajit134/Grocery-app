output "namespace" {
  description = "Namespace where External Secrets Operator is deployed"
  value       = kubernetes_namespace_v1.external_secrets.metadata[0].name
}

output "cluster_secret_store_name" {
  description = "Name of the ClusterSecretStore configured for Vault"
  value       = "vault-backend"
}
