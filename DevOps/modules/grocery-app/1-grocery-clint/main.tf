resource "kubectl_manifest" "admin-dp-deployment" {
  yaml_body  = file("${path.module}/admin-dp-deployment.yaml")
  depends_on = [kubectl_manifest.grocery-clint-namespace]
}

resource "kubectl_manifest" "admin-svc-service" {
  yaml_body  = file("${path.module}/admin-svc-service.yaml")
  depends_on = [kubectl_manifest.grocery-clint-namespace]
}

resource "kubectl_manifest" "delivery-partner-dp-deployment" {
  yaml_body  = file("${path.module}/delivery-partner-dp-deployment.yaml")
  depends_on = [kubectl_manifest.grocery-clint-namespace]
}

resource "kubectl_manifest" "delivery-partner-svc-service" {
  yaml_body  = file("${path.module}/delivery-partner-svc-service.yaml")
  depends_on = [kubectl_manifest.grocery-clint-namespace]
}

resource "kubectl_manifest" "frontend-dp-deployment" {
  yaml_body  = file("${path.module}/frontend-dp-deployment.yaml")
  depends_on = [kubectl_manifest.grocery-clint-namespace]
}

resource "kubectl_manifest" "frontend-svc-service" {
  yaml_body  = file("${path.module}/frontend-svc-service.yaml")
  depends_on = [kubectl_manifest.grocery-clint-namespace]
}

resource "kubectl_manifest" "grocery-clint-namespace" {
  yaml_body = file("${path.module}/grocery-clint-namespace.yaml")
}

resource "kubectl_manifest" "vendor-dp-deployment" {
  yaml_body  = file("${path.module}/vendor-dp-deployment.yaml")
  depends_on = [kubectl_manifest.grocery-clint-namespace]
}

resource "kubectl_manifest" "vendor-svc-service" {
  yaml_body  = file("${path.module}/vendor-svc-service.yaml")
  depends_on = [kubectl_manifest.grocery-clint-namespace]
}

resource "kubectl_manifest" "admin-hpa" {
  yaml_body  = file("${path.module}/admin-hpa.yaml")
  depends_on = [kubectl_manifest.admin-dp-deployment]
}

resource "kubectl_manifest" "delivery-partner-hpa" {
  yaml_body  = file("${path.module}/delivery-partner-hpa.yaml")
  depends_on = [kubectl_manifest.delivery-partner-dp-deployment]
}

resource "kubectl_manifest" "frontend-hpa" {
  yaml_body  = file("${path.module}/frontend-hpa.yaml")
  depends_on = [kubectl_manifest.frontend-dp-deployment]
}

resource "kubectl_manifest" "vendor-hpa" {
  yaml_body  = file("${path.module}/vendor-hpa.yaml")
  depends_on = [kubectl_manifest.vendor-dp-deployment]
}

resource "kubectl_manifest" "admin-dr" {
  yaml_body  = file("${path.module}/admin-dr.yaml")
  depends_on = [kubectl_manifest.admin-svc-service]
}

resource "kubectl_manifest" "delivery-partner-dr" {
  yaml_body  = file("${path.module}/delivery-partner-dr.yaml")
  depends_on = [kubectl_manifest.delivery-partner-svc-service]
}

resource "kubectl_manifest" "frontend-dr" {
  yaml_body  = file("${path.module}/frontend-dr.yaml")
  depends_on = [kubectl_manifest.frontend-svc-service]
}

resource "kubectl_manifest" "vendor-dr" {
  yaml_body  = file("${path.module}/vendor-dr.yaml")
  depends_on = [kubectl_manifest.vendor-svc-service]
}

