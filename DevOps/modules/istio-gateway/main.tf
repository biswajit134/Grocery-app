# ------------------------------------------------------------------------------
# TLS/SSL Root CA & Leaf Certificate for Istio Ingress Gateway
# ------------------------------------------------------------------------------

# 1. Dedicated Root Certificate Authority (CA)
resource "tls_private_key" "ca" {
  algorithm = "RSA"
  rsa_bits  = 2048
}

resource "tls_self_signed_cert" "ca" {
  private_key_pem = tls_private_key.ca.private_key_pem

  subject {
    common_name  = "GroceryHub Local Root CA"
    organization = "GroceryHub"
  }

  validity_period_hours = 87600 # 10 years
  is_ca_certificate     = true

  allowed_uses = [
    "cert_signing",
    "crl_signing",
    "digital_signature",
  ]
}

# 2. Server (Leaf) Certificate for Istio Ingress
resource "tls_private_key" "ingress" {
  algorithm = "RSA"
  rsa_bits  = 2048
}

resource "tls_cert_request" "ingress" {
  private_key_pem = tls_private_key.ingress.private_key_pem

  subject {
    common_name  = "localhost"
    organization = "GroceryHub"
  }

  dns_names    = ["localhost", "*.localhost", "groceryhub.local"]
  ip_addresses = ["127.0.0.1"]
}

resource "tls_locally_signed_cert" "ingress" {
  cert_request_pem   = tls_cert_request.ingress.cert_request_pem
  ca_private_key_pem = tls_private_key.ca.private_key_pem
  ca_cert_pem        = tls_self_signed_cert.ca.cert_pem

  validity_period_hours = 8760 # 1 year
  is_ca_certificate     = false

  allowed_uses = [
    "key_encipherment",
    "digital_signature",
    "server_auth",
  ]
}

resource "kubernetes_secret_v1" "grocery_tls_cert" {
  metadata {
    name      = "grocery-tls-cert"
    namespace = "istio-gateway"
  }

  type = "kubernetes.io/tls"

  data = {
    "tls.crt" = "${tls_locally_signed_cert.ingress.cert_pem}\n${tls_self_signed_cert.ca.cert_pem}"
    "tls.key" = tls_private_key.ingress.private_key_pem
  }
}

resource "kubectl_manifest" "grocery-gateway-gateway" {
  yaml_body  = file("${path.module}/grocery-gateway-gateway.yaml")
  depends_on = [kubernetes_secret_v1.grocery_tls_cert]
}

resource "kubectl_manifest" "grocery-app-vs" {
  yaml_body  = file("${path.module}/grocery-app-vs.yaml")
  depends_on = [kubectl_manifest.grocery-gateway-gateway]
}

resource "kubectl_manifest" "peer_authentication" {
  yaml_body = file("${path.module}/PeerAuthentication.yaml")
}


