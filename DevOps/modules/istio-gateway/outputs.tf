output "root_ca_cert_pem" {
  description = "Root CA Certificate in PEM format"
  value       = tls_self_signed_cert.ca.cert_pem
}

output "server_cert_pem" {
  description = "Leaf Server Certificate in PEM format"
  value       = tls_locally_signed_cert.ingress.cert_pem
}
