resource "kubernetes_namespace_v1" "external_secrets" {
  metadata {
    name = var.namespace
    labels = {
      name = var.namespace
    }
  }
}

resource "helm_release" "external_secrets" {
  name         = "external-secrets"
  repository   = "https://charts.external-secrets.io"
  chart        = "external-secrets"
  version      = var.external_secrets_version
  namespace    = kubernetes_namespace_v1.external_secrets.metadata[0].name
  force_update = true
  wait         = true
  timeout      = 600

  values = [yamlencode({
    installCRDs = true
  })]

  depends_on = [kubernetes_namespace_v1.external_secrets]
}

# Secret storing the Vault root/service token for authentication
resource "kubernetes_secret_v1" "vault_token" {
  metadata {
    name      = "vault-token"
    namespace = kubernetes_namespace_v1.external_secrets.metadata[0].name
  }

  type = "Opaque"

  data = {
    token = var.vault_root_token
  }

  depends_on = [kubernetes_namespace_v1.external_secrets]
}

# ClusterSecretStore allows all namespaces (grocery-database, grocery-backend) to pull secrets from Vault
resource "kubectl_manifest" "vault_cluster_secret_store" {
  yaml_body = yamlencode({
    apiVersion = "external-secrets.io/v1beta1"
    kind       = "ClusterSecretStore"
    metadata = {
      name = "vault-backend"
    }
    spec = {
      provider = {
        vault = {
          server  = var.vault_server_url
          path    = "secret"
          version = "v2"
          auth = {
            tokenSecretRef = {
              name      = kubernetes_secret_v1.vault_token.metadata[0].name
              namespace = kubernetes_namespace_v1.external_secrets.metadata[0].name
              key       = "token"
            }
          }
        }
      }
    }
  })

  depends_on = [
    helm_release.external_secrets,
    kubernetes_secret_v1.vault_token
  ]
}
