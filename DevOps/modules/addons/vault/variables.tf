variable "namespace" {
  description = "Namespace where Vault is deployed"
  type        = string
  default     = "vault"
}

variable "vault_version" {
  description = "Version of the HashiCorp Vault Helm chart"
  type        = string
  default     = "0.29.1"
}

variable "vault_root_token" {
  description = "Root token for Vault dev server mode"
  type        = string
  sensitive   = true
  default     = "root"
}

variable "vault_node_port" {
  description = "NodePort to expose Vault UI and API"
  type        = number
  default     = 30007
}

variable "vault_host_port" {
  description = "Host port mapped to Vault NodePort"
  type        = number
  default     = 31007
}
