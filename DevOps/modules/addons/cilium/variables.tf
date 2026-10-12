variable "cilium_version" {
  type        = string
  description = "Version of the Cilium Helm chart to deploy."
  default     = "1.21.0-pre.3"
}

variable "hubble_ui_node_port" {
  type        = number
  description = "The NodePort to expose Hubble UI."
  default     = 30000
}
