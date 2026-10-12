variable "cluster_name" {
  type        = string
  description = "The name of the kind cluster."
  default     = "kind-cilium"
}

variable "node_image" {
  type        = string
  description = "The node image to use for the kind cluster."
  default     = "kindest/node:v1.36.4"
}

variable "kubeconfig_path" {
  type        = string
  description = "Path to write the kubeconfig file. Null writes to ./<cluster_name>-config"
  default     = null
}

