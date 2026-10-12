locals {
  kubeconfig_path = var.kubeconfig_path != null ? var.kubeconfig_path : "${path.module}/${var.cluster_name}-config"
}

resource "kind_cluster" "this" {
  name            = var.cluster_name
  node_image      = var.node_image
  kubeconfig_path = local.kubeconfig_path
  wait_for_ready  = false

  kind_config {
    kind        = "Cluster"
    api_version = "kind.x-k8s.io/v1alpha4"

    networking {
      disable_default_cni = true
    }

    node {
      role = "control-plane"

      extra_port_mappings {
        container_port = 30000
        host_port      = 31000
        listen_address = "127.0.0.1"
      }

      extra_port_mappings {
        container_port = 80
        host_port      = 80
        listen_address = "127.0.0.1"
      }

      extra_port_mappings {
        container_port = 30001
        host_port      = 31001
        listen_address = "127.0.0.1"
      }

      extra_port_mappings {
        container_port = 30002
        host_port      = 31002
        listen_address = "127.0.0.1"
      }

      extra_port_mappings {
        container_port = 30003
        host_port      = 31003
        listen_address = "127.0.0.1"
      }

      extra_port_mappings {
        container_port = 30004
        host_port      = 31004
        listen_address = "127.0.0.1"
      }

      extra_port_mappings {
        container_port = 31200
        host_port      = 31006
        listen_address = "127.0.0.1"
      }

    }

    node {
      role = "worker"
    }

    node {
      role = "worker"
    }
  }
}
