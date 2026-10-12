variable "argocd_namespace" {
  type        = string
  description = "Namespace where ArgoCD server and CRDs are deployed"
  default     = "argocd"
}

variable "repo_url" {
  type        = string
  description = "Target Git repository URL tracked by ArgoCD"
  default     = "https://github.com/biswajit134/Grocery-app.git"
}

variable "target_revision" {
  type        = string
  description = "Git revision (branch, tag, or HEAD) tracked by ArgoCD"
  default     = "HEAD"
}

variable "database_chart_path" {
  type        = string
  description = "Path within the repository to the database Helm chart"
  default     = "DevOps/grocery-hrlm-charts/grocery-database"
}

variable "backend_chart_path" {
  type        = string
  description = "Path within the repository to the backend Helm chart"
  default     = "DevOps/grocery-hrlm-charts/grocery-backend"
}

variable "client_chart_path" {
  type        = string
  description = "Path within the repository to the client Helm chart"
  default     = "DevOps/grocery-hrlm-charts/grocery-client"
}

variable "database_namespace" {
  type        = string
  description = "Kubernetes destination namespace for grocery-database"
  default     = "grocery-database"
}

variable "backend_namespace" {
  type        = string
  description = "Kubernetes destination namespace for grocery-backend"
  default     = "grocery-backend"
}

variable "client_namespace" {
  type        = string
  description = "Kubernetes destination namespace for grocery-clint"
  default     = "grocery-clint"
}

variable "create_namespaces" {
  type        = bool
  description = "Whether to pre-create and label the application namespaces with istio-injection=enabled"
  default     = true
}

variable "enable_auto_sync" {
  type        = bool
  description = "Enable automatic synchronization in ArgoCD"
  default     = true
}

variable "enable_self_heal" {
  type        = bool
  description = "Enable ArgoCD self-healing (automatically reverts out-of-band cluster modifications)"
  default     = true
}

variable "enable_prune" {
  type        = bool
  description = "Enable pruning of resources deleted from Git"
  default     = true
}
