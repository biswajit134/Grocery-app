resource "helm_release" "metrics_server" {
  name       = "metrics-server"
  repository = "https://kubernetes-sigs.github.io/metrics-server/"
  chart      = "metrics-server"
  version      = var.metrics_server_version
  namespace    = "kube-system"
  force_update = true

  # Kind clusters require insecure TLS on kubelets and internal IP resolution
  values = [yamlencode({
    args = [
      "--kubelet-insecure-tls",
      "--kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname"
    ]
  })]
}
