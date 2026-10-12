resource "helm_release" "sealed_secrets" {
  name         = "sealed-secrets"
  repository   = "https://bitnami.github.io/sealed-secrets"
  chart        = "sealed-secrets"
  version      = var.sealed_secrets_version
  namespace    = var.namespace
  force_update   = true
  take_ownership = true

  values = [yamlencode({
    fullnameOverride = "sealed-secrets-controller"
  })]
}
