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
  type = string
  default = "admin"
}


