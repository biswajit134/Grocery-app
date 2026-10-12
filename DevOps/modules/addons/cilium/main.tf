resource "helm_release" "cilium" {
  name         = "cilium-cni"
  repository   = "https://helm.cilium.io/"
  force_update = true
  chart        = "cilium"
  version      = var.cilium_version
  namespace    = "kube-system"

  # Wait for Cilium (and the nodes) to become ready
  wait    = true
  timeout = 600

  values = [yamlencode({
    image = {
      pullPolicy = "IfNotPresent"
    }
    ipam = {
      mode = "kubernetes"
    }
    operator = {
      replicas = 1
    }
    hostPort = {
      enabled = true
    }
    hubble = {
      enabled = true
      relay = {
        enabled = true
      }
      ui = {
        enabled = true
        service = {
          type = "ClusterIP"
        }
      }
    }
  })]
}
