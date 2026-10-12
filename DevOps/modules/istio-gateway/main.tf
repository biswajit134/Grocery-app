resource "kubectl_manifest" "grocery-gateway-gateway" {
  yaml_body = file("${path.module}/grocery-gateway-gateway.yaml")
}

resource "kubectl_manifest" "grocery-app-vs" {
  yaml_body  = file("${path.module}/grocery-app-vs.yaml")
  depends_on = [kubectl_manifest.grocery-gateway-gateway]
}


