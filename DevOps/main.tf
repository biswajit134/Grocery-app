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
  source = "./modules/addons/ArgoCD"
  ARGOCD_PASSWORD = var.ARGOCD_PASSWORD

  depends_on = [module.istio]
}

module "observability" {
  source = "./modules/addons/observability"

  depends_on = [module.istio]
}

#
#   Grocery App Module
#

module "grocery_database" {
  source = "./modules/grocery-app/3-grocery-database"

  depends_on = [module.istio]
}

module "grocery_backend" {
  source = "./modules/grocery-app/2-grocery-backend"

  depends_on = [module.grocery_database]
}

module "grocery_clint" {
  source = "./modules/grocery-app/1-grocery-clint"

  depends_on = [module.grocery_backend]
}

module "istio_gateway" {
  source = "./modules/grocery-app/istio-gateway"

  depends_on = [module.grocery_clint]
}


