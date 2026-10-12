
resource "kubectl_manifest" "grocery-backend-namespace" {
  yaml_body = file("${path.module}/grocery-backend-namespace.yaml")
}

resource "kubectl_manifest" "backend-config-configmap" {
  yaml_body = file("${path.module}/backend-config-configmap.yaml")
  depends_on = [kubectl_manifest.grocery-backend-namespace]
}

resource "kubectl_manifest" "backend-secret-secret" {
  yaml_body = file("${path.module}/backend-secret-secret.yaml")
  depends_on = [kubectl_manifest.grocery-backend-namespace]
}

resource "kubectl_manifest" "auth-service-dp-deployment" {
  yaml_body = file("${path.module}/auth-service-dp-deployment.yaml")
  depends_on = [
    kubectl_manifest.grocery-backend-namespace,
    kubectl_manifest.backend-config-configmap,
    kubectl_manifest.backend-secret-secret
  ]
}

resource "kubectl_manifest" "auth-svc-service" {
  yaml_body = file("${path.module}/auth-svc-service.yaml")
  depends_on = [kubectl_manifest.grocery-backend-namespace]
}

resource "kubectl_manifest" "order-service-dp-deployment" {
  yaml_body = file("${path.module}/order-service-dp-deployment.yaml")
  depends_on = [
    kubectl_manifest.grocery-backend-namespace,
    kubectl_manifest.backend-config-configmap,
    kubectl_manifest.backend-secret-secret
  ]
}

resource "kubectl_manifest" "order-svc-service" {
  yaml_body = file("${path.module}/order-svc-service.yaml")
  depends_on = [kubectl_manifest.grocery-backend-namespace]
}

resource "kubectl_manifest" "product-service-dp-deployment" {
  yaml_body = file("${path.module}/product-service-dp-deployment.yaml")
  depends_on = [
    kubectl_manifest.grocery-backend-namespace,
    kubectl_manifest.backend-config-configmap,
    kubectl_manifest.backend-secret-secret
  ]
}

resource "kubectl_manifest" "product-svc-service" {
  yaml_body = file("${path.module}/product-svc-service.yaml")
  depends_on = [kubectl_manifest.grocery-backend-namespace]
}

resource "kubectl_manifest" "api-gateway-dp-deployment" {
  yaml_body = file("${path.module}/api-gateway-dp-deployment.yaml")
  depends_on = [
    kubectl_manifest.grocery-backend-namespace,
    kubectl_manifest.backend-config-configmap,
    kubectl_manifest.backend-secret-secret
  ]
}

resource "kubectl_manifest" "api-gateway-svc-service" {
  yaml_body = file("${path.module}/api-gateway-svc-service.yaml")
  depends_on = [kubectl_manifest.grocery-backend-namespace]
}

resource "kubectl_manifest" "api-gateway-hpa" {
  yaml_body = file("${path.module}/api-gateway-hpa.yaml")
  depends_on = [kubectl_manifest.api-gateway-dp-deployment]
}

resource "kubectl_manifest" "auth-service-hpa" {
  yaml_body = file("${path.module}/auth-service-hpa.yaml")
  depends_on = [kubectl_manifest.auth-service-dp-deployment]
}

resource "kubectl_manifest" "order-service-hpa" {
  yaml_body = file("${path.module}/order-service-hpa.yaml")
  depends_on = [kubectl_manifest.order-service-dp-deployment]
}

resource "kubectl_manifest" "product-service-hpa" {
  yaml_body = file("${path.module}/product-service-hpa.yaml")
  depends_on = [kubectl_manifest.product-service-dp-deployment]
}

resource "kubectl_manifest" "api-gateway-dr" {
  yaml_body = file("${path.module}/api-gateway-dr.yaml")
  depends_on = [kubectl_manifest.api-gateway-svc-service]
}

resource "kubectl_manifest" "auth-service-dr" {
  yaml_body = file("${path.module}/auth-service-dr.yaml")
  depends_on = [kubectl_manifest.auth-svc-service]
}

resource "kubectl_manifest" "order-service-dr" {
  yaml_body = file("${path.module}/order-service-dr.yaml")
  depends_on = [kubectl_manifest.order-svc-service]
}

resource "kubectl_manifest" "product-service-dr" {
  yaml_body = file("${path.module}/product-service-dr.yaml")
  depends_on = [kubectl_manifest.product-svc-service]
}
