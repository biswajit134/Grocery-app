resource "kubernetes_namespace_v1" "istio-system" {
  metadata {
    name = "istio-system"
    labels = {
      name = "istio-system"
    }
  }
}

resource "kubernetes_namespace_v1" "istio-gateway" {
  metadata {
    name = "istio-gateway"
    labels = {
      name            = "istio-gateway"
      istio-injection = "enabled"
    }
  }
}

resource "helm_release" "istio_base" {
  name         = "istio-base"
  repository   = "https://istio-release.storage.googleapis.com/charts"
  force_update = true
  chart        = "base"
  version      = var.istio_version
  namespace    = "istio-system"
  depends_on   = [kubernetes_namespace_v1.istio-system]
}

resource "helm_release" "istiod" {
  name         = "istiod"
  repository   = "https://istio-release.storage.googleapis.com/charts"
  force_update = true
  chart        = "istiod"
  version      = var.istio_version
  namespace    = "istio-system"
  depends_on   = [kubernetes_namespace_v1.istio-system, helm_release.istio_base]
}

resource "helm_release" "istio_gateway" {
  name         = "istio-gateway"
  repository   = "https://istio-release.storage.googleapis.com/charts"
  force_update = true
  chart        = "gateway"
  version      = var.istio_version
  namespace    = "istio-gateway"

  values = [yamlencode({
    service = {
      type = "NodePort"
      ports = [
        {
          name       = "status-port"
          port       = 15021
          protocol   = "TCP"
          targetPort = 15021
        },
        {
          name       = "http2"
          port       = 80
          nodePort   = 30000
          protocol   = "TCP"
          targetPort = 80
        },
        {
          name       = "https"
          port       = 443
          protocol   = "TCP"
          targetPort = 443
        }
      ]
    }
  })]

  depends_on = [kubernetes_namespace_v1.istio-gateway, helm_release.istiod]
}
