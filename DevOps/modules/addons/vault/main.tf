resource "kubernetes_namespace_v1" "vault" {
  metadata {
    name = var.namespace
    labels = {
      name = var.namespace
    }
  }
}

resource "helm_release" "vault" {
  name         = "vault"
  repository   = "https://helm.releases.hashicorp.com"
  chart        = "vault"
  version      = var.vault_version
  namespace    = kubernetes_namespace_v1.vault.metadata[0].name
  force_update = true
  wait         = true
  timeout      = 600

  values = [yamlencode({
    server = {
      dev = {
        enabled       = true
        devRootToken = var.vault_root_token
      }
      service = {
        type     = "NodePort"
        nodePort = var.vault_node_port
      }
    }
    ui = {
      enabled     = true
      serviceType = "ClusterIP"
    }
    injector = {
      enabled = false
    }
  })]

  depends_on = [kubernetes_namespace_v1.vault]
}

# Automatically seed application secrets into Vault KV-v2 engine upon bootstrap
resource "kubernetes_job_v1" "seed_vault_secrets" {
  metadata {
    name      = "seed-vault-secrets"
    namespace = kubernetes_namespace_v1.vault.metadata[0].name
  }

  spec {
    template {
      metadata {
        name = "seed-vault-secrets"
      }
      spec {
        restart_policy = "OnFailure"
        container {
          name    = "vault-seeder"
          image   = "curlimages/curl:latest"
          command = ["/bin/sh", "-c"]
          args = [
            <<-EOT
            echo "[INFO] Waiting for Vault API..."
            until curl -s http://vault.${var.namespace}.svc.cluster.local:8200/v1/sys/health | grep -q '"initialized":true'; do
              echo "[INFO] Waiting for Vault to be initialized..."
              sleep 2
            done

            echo "[INFO] Seeding grocery/database secrets..."
            curl -s -f -X POST \
              -H "X-Vault-Token: ${var.vault_root_token}" \
              -H "Content-Type: application/json" \
              -d '{"data":{"MONGO_INITDB_ROOT_USERNAME":"admin","MONGO_INITDB_ROOT_PASSWORD":"password123"}}' \
              http://vault.${var.namespace}.svc.cluster.local:8200/v1/secret/data/grocery/database

            echo "[INFO] Seeding grocery/backend secrets..."
            curl -s -f -X POST \
              -H "X-Vault-Token: ${var.vault_root_token}" \
              -H "Content-Type: application/json" \
              -d '{"data":{"JWT_SECRET":"supersecretjwtkeyforgroceryhub","AUTH_MONGO_URI":"mongodb://admin:password123@mongodb-svc.grocery-database.svc.cluster.local:27017/grocery_auth?authSource=admin","PRODUCT_MONGO_URI":"mongodb://admin:password123@mongodb-svc.grocery-database.svc.cluster.local:27017/grocery_product?authSource=admin","ORDER_MONGO_URI":"mongodb://admin:password123@mongodb-svc.grocery-database.svc.cluster.local:27017/grocery_order?authSource=admin"}}' \
              http://vault.${var.namespace}.svc.cluster.local:8200/v1/secret/data/grocery/backend

            echo "[SUCCESS] Vault secrets successfully seeded!"
            EOT
          ]
        }
      }
    }
    backoff_limit = 5
  }

  wait_for_completion = true

  timeouts {
    create = "2m"
    update = "2m"
  }

  depends_on = [helm_release.vault]
}
