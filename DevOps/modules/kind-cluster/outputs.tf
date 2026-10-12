output "cluster_name" {
  description = "The name of the created kind cluster."
  value       = kind_cluster.this.name
}

output "endpoint" {
  description = "The Kubernetes API server endpoint."
  value       = kind_cluster.this.endpoint
}

output "kubeconfig_path" {
  description = "Path to the generated kubeconfig file."
  value       = local.kubeconfig_path
}

output "client_certificate" {
  description = "Base64 encoded public certificate used by clients to authenticate to the cluster endpoint."
  value       = kind_cluster.this.client_certificate
}

output "client_key" {
  description = "Base64 encoded private key used by clients to authenticate to the cluster endpoint."
  value       = kind_cluster.this.client_key
  sensitive   = true
}

output "cluster_ca_certificate" {
  description = "Base64 encoded public certificate that is the root of trust for the cluster."
  value       = kind_cluster.this.cluster_ca_certificate
}
