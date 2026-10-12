variable "namespace" {
  description = "Namespace for MetalLB"
  type        = string
  default     = "metallb-system"
}

variable "metallb_version" {
  description = "Version of the MetalLB Helm chart"
  type        = string
  default     = "0.14.8" # A recent stable version
}
