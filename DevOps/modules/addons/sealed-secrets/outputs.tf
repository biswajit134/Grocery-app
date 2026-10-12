output "controller_name" {
  description = "The name of the Sealed Secrets controller service"
  value       = "sealed-secrets-controller"
}

output "namespace" {
  description = "The namespace where the Sealed Secrets controller is deployed"
  value       = var.namespace
}
