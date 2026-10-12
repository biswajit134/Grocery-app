variable "ARGOCD_PASSWORD" {
  type        = string
  description = "Administrator password for ArgoCD"
  sensitive   = true
}

variable "ARGOCD_SERVER_SECRETKEY" {
  type        = string
  description = "Encryption secret key for ArgoCD server"
  sensitive   = true
  default     = "a-very-secure-random-secret-key-32chars!"
}