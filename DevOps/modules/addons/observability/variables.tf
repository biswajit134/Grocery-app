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

variable "grafana_admin_password" {
  type        = string
  description = "Administrator password for Grafana"
  sensitive   = true
  default     = "admin"
}

variable "enable_persistence" {
  type        = bool
  description = "Enable persistent volumes for Prometheus, Alertmanager, Grafana, and Loki"
  default     = true
}

variable "storage_class" {
  type        = string
  description = "StorageClass name for persistent volumes"
  default     = "standard"
}

variable "prometheus_storage_size" {
  type        = string
  description = "Persistent volume size for Prometheus server"
  default     = "10Gi"
}

variable "alertmanager_storage_size" {
  type        = string
  description = "Persistent volume size for Alertmanager"
  default     = "2Gi"
}

variable "grafana_storage_size" {
  type        = string
  description = "Persistent volume size for Grafana"
  default     = "5Gi"
}

variable "loki_storage_size" {
  type        = string
  description = "Persistent volume size for Loki"
  default     = "10Gi"
}

variable "prometheus_retention" {
  type        = string
  description = "Time-based metric data retention period for Prometheus"
  default     = "15d"
}

variable "prometheus_retention_size" {
  type        = string
  description = "Size-based metric data retention cap for Prometheus to prevent disk exhaustion"
  default     = "8Gi"
}

variable "grafana_anonymous_access" {
  type        = bool
  description = "Enable anonymous read-only viewer access for local development/demo"
  default     = true
}

variable "alertmanager_slack_webhook" {
  type        = string
  description = "Optional Slack incoming webhook URL for critical alerts"
  default     = ""
  sensitive   = true
}

