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
      name = "istio-gateway"
    }
  }
}

resource "helm_release" "istio_base" {
  name             = "istio-base"
  repository       = "https://blob.istio.io/istio-release/charts"
  force_update     = true
  chart            = "base"
  version          = var.istio_version
  namespace        = kubernetes_namespace_v1.istio-system.metadata[0].name
  create_namespace = false
  cleanup_on_fail  = true
  wait             = true
  timeout          = 600

  depends_on = [kubernetes_namespace_v1.istio-system]
}

resource "helm_release" "istiod" {
  name             = "istiod"
  repository       = "https://blob.istio.io/istio-release/charts"
  force_update     = true
  chart            = "istiod"
  version          = var.istio_version
  namespace        = kubernetes_namespace_v1.istio-system.metadata[0].name
  create_namespace = false
  cleanup_on_fail  = true
  wait             = true
  timeout          = 600

  depends_on = [kubernetes_namespace_v1.istio-system, helm_release.istio_base]
}

resource "helm_release" "istio_gateway" {
  name             = "istio-gateway"
  repository       = "https://blob.istio.io/istio-release/charts"
  force_update     = true
  chart            = "gateway"
  version          = var.istio_version
  namespace        = kubernetes_namespace_v1.istio-gateway.metadata[0].name
  create_namespace = false
  cleanup_on_fail  = true
  wait             = true
  timeout          = 600

  values = [yamlencode({
    service = {
      type = "NodePort"
      ports = [
        {
          name       = "tcp-status-port"
          port       = 15021
          protocol   = "TCP"
          targetPort = 15021
        },
        {
          name       = "http2"
          port       = 80
          nodePort   = 30080
          protocol   = "TCP"
          targetPort = 80
        },
        {
          name       = "https"
          port       = 443
          nodePort   = 30000
          protocol   = "TCP"
          targetPort = 443
        }
      ]
    }
  })]

  depends_on = [kubernetes_namespace_v1.istio-gateway, helm_release.istiod]
}
