variable "cluster_name" {
  type        = string
  description = "The name of the kind cluster."
  default     = "kind-cilium"
}

variable "cilium_version" {
  type        = string
  description = "Version of the Cilium Helm chart to deploy."
  default     = "1.21.0-pre.3"
}

variable "istio_version" {
  type        = string
  description = "Version of the Istio Helm chart to deploy."
  default     = "1.31.0-rc.0"
}

variable "ARGOCD_PASSWORD" {
  type        = string
  description = "Administrator password for ArgoCD"
  sensitive   = true
  default     = "admin"
}

variable "GRAFANA_ADMIN_PASSWORD" {
  type        = string
  description = "Administrator password for Grafana"
  sensitive   = true
  default     = "admin"
}

variable "ARGOCD_SERVER_SECRETKEY" {
  type        = string
  description = "Encryption secret key for ArgoCD server"
  sensitive   = true
  default     = "a-very-secure-random-secret-key-32chars!"
}

variable "VAULT_DEV_ROOT_TOKEN" {
  type        = string
  description = "Dev mode root token for HashiCorp Vault"
  sensitive   = true
  default     = "root"
}

variable "vault_version" {
  type        = string
  description = "Version of the HashiCorp Vault Helm chart"
  default     = "0.29.1"
}

variable "external_secrets_version" {
  type        = string
  description = "Version of the External Secrets Operator Helm chart"
  default     = "0.14.3"
}
