variable "namespace" {
  description = "Namespace for observability tools"
  type        = string
  default     = "observability"
}

variable "kiali_node_port" {
  type    = number
  default = 30001
}
variable "kiali_host_port" {
  type    = number
  default = 31001
}

variable "jaeger_node_port" {
  type    = number
  default = 30002
}
variable "jaeger_host_port" {
  type    = number
  default = 31002
}

variable "prometheus_node_port" {
  type    = number
  default = 30003
}
variable "prometheus_host_port" {
  type    = number
  default = 31003
}

variable "grafana_node_port" {
  type    = number
  default = 30004
}
variable "grafana_host_port" {
  type    = number
  default = 31004
}
