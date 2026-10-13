variable "namespace" {
  description = "Namespace where External Secrets Operator is deployed"
  type        = string
  default     = "external-secrets"
}

variable "external_secrets_version" {
  description = "Version of the External Secrets Operator Helm chart"
  type        = string
  default     = "0.14.3"
}

variable "vault_root_token" {
  description = "Vault token used by the ClusterSecretStore"
  type        = string
  sensitive   = true
  default     = "root"
}

variable "vault_server_url" {
  description = "In-cluster URL of the HashiCorp Vault server"
  type        = string
  default     = "http://vault.vault.svc.cluster.local:8200"
}
