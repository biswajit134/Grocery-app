terraform {
  required_providers {
    helm = {
      source  = "hashicorp/helm"
      version = ">= 3.3"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 3.3.0"
    }
    kubectl = {
      source  = "gavinbunney/kubectl"
      version = ">= 1.14.0"
    }
  }
}
