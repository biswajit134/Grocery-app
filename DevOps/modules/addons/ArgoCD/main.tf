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
  }
}

resource "kubernetes_namespace_v1" "argocd" {
  metadata {
    name = "argocd"
    labels = {
      istio-injection = "enabled"
    }
  }
}

resource "helm_release" "argocd" {
  name         = "argocd"
  repository   = "https://argoproj.github.io/argo-helm"
  force_update = true
  chart        = "argo-cd"
  version      = "10.10.2"
  namespace    = kubernetes_namespace_v1.argocd.metadata[0].name

  values = [yamlencode({
    server = {
      service = {
        type         = "NodePort"
        nodePortHttp = 31200
      }
      extraArgs = [
        "--insecure"
      ]
    }
    configs = {
      params = {
        "server.insecure" = true
      }
      secret = {
        argocdServerAdminPassword = bcrypt(var.ARGOCD_PASSWORD, 10)
        extra = {
          "server.secretkey" = var.ARGOCD_SERVER_SECRETKEY
        }
      }
    }
  })]
}