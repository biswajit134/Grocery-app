resource "kubectl_manifest" "mongodb-secret-secret" {
  yaml_body  = file("${path.module}/mongodb-secret-secret.yaml")
  depends_on = [kubectl_manifest.grocery-database-namespace]
}

resource "kubectl_manifest" "mongodb-svc-service" {
  yaml_body  = file("${path.module}/mongodb-svc-service.yaml")
  depends_on = [kubectl_manifest.grocery-database-namespace]
}

resource "kubectl_manifest" "mongodb-ss-statefulset" {
  yaml_body = file("${path.module}/mongodb-ss-statefulset.yaml")
  depends_on = [
    kubectl_manifest.grocery-database-namespace,
    kubectl_manifest.grocery-storage-storageclass
  ]
}

resource "kubectl_manifest" "grocery-database-namespace" {
  yaml_body = file("${path.module}/grocery-database-namespace.yaml")
}

resource "kubectl_manifest" "redis-pvc-persistentvolumeclaim" {
  yaml_body = file("${path.module}/redis-pvc-persistentvolumeclaim.yaml")
  depends_on = [
    kubectl_manifest.grocery-database-namespace,
    kubectl_manifest.grocery-storage-storageclass
  ]
}

resource "kubectl_manifest" "redis-deployment" {
  yaml_body  = file("${path.module}/redis-deployment.yaml")
  depends_on = [kubectl_manifest.grocery-database-namespace]
}

resource "kubectl_manifest" "redis-svc-service" {
  yaml_body  = file("${path.module}/redis-svc-service.yaml")
  depends_on = [kubectl_manifest.grocery-database-namespace]
}

resource "kubectl_manifest" "grocery-storage-storageclass" {
  yaml_body  = file("${path.module}/grocery-storage-storageclass.yaml")
  depends_on = [kubectl_manifest.grocery-database-namespace]
}


