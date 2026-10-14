output "cilium_version" {
  description = "The deployed version of Cilium."
  value       = helm_release.cilium.version
}

output "hubble_ui_url" {
  description = "URL to access the Hubble UI."
  value       = "http://localhost:${var.hubble_ui_host_port}/"
}
