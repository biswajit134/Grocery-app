#
#   Infrastructure Module
#

module "kind_cluster" {
  source       = "./modules/kind-cluster"
  cluster_name = var.cluster_name
}

#
#   Addons Module
#

module "cilium" {
  source         = "./modules/addons/cilium"
  cilium_version = var.cilium_version

  depends_on = [module.kind_cluster]
}

module "istio" {
  source        = "./modules/addons/istio"
  istio_version = var.istio_version
  cluster_name  = var.cluster_name

  depends_on = [module.cilium]
}

module "argocd" {
  source                  = "./modules/addons/ArgoCD"
  ARGOCD_PASSWORD         = var.ARGOCD_PASSWORD
  ARGOCD_SERVER_SECRETKEY = var.ARGOCD_SERVER_SECRETKEY

  depends_on = [module.istio]
}

module "observability" {
  source                 = "./modules/addons/observability"
  grafana_admin_password = var.GRAFANA_ADMIN_PASSWORD

  depends_on = [module.istio]
}

module "metrics_server" {
  source = "./modules/addons/metrics-server"

  depends_on = [module.cilium]
}

module "vault" {
  source           = "./modules/addons/vault"
  vault_root_token = var.VAULT_DEV_ROOT_TOKEN
  vault_version    = var.vault_version

  depends_on = [module.cilium]
}

module "external_secrets" {
  source                   = "./modules/addons/external-secrets"
  external_secrets_version = var.external_secrets_version
  vault_root_token         = var.VAULT_DEV_ROOT_TOKEN
  vault_server_url         = module.vault.vault_server_url

  depends_on = [module.vault]
}

#
#   Grocery App Module (ArgoCD GitOps)
#

module "argocd_grocery_app" {
  source = "./modules/ArgoCD-grocery-app"

  depends_on = [module.argocd, module.external_secrets]
}

module "istio_gateway" {
  source = "./modules/istio-gateway"

  depends_on = [module.argocd_grocery_app]
}

# (Optional: Direct Terraform manifest deployment without ArgoCD)
# module "grocery_database" {
#   source = "./modules/grocery-app/3-grocery-database"
#   depends_on = [module.istio]
# }
# module "grocery_backend" {
#   source = "./modules/grocery-app/2-grocery-backend"
#   depends_on = [module.grocery_database]
# }
# module "grocery_clint" {
#   source = "./modules/grocery-app/1-grocery-clint"
#   depends_on = [module.grocery_backend]
# }


