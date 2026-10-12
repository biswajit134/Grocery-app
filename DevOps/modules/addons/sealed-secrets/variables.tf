variable "sealed_secrets_version" {
  type        = string
  description = "Version of the Sealed Secrets Helm chart to deploy"
  default     = "2.20.0"
}

variable "namespace" {
  type        = string
  description = "Target namespace for the Sealed Secrets controller"
  default     = "kube-system"
}
