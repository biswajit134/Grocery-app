variable "istio_version" {
  type        = string
  description = "Version of the Istio Helm chart to deploy."
}

variable "cluster_name" {
  type        = string
  description = "Name of the kind cluster"
}
