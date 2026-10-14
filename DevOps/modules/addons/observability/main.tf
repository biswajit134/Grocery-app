# ==============================================================================
# Observability Module (Production-Grade Stack)
# ==============================================================================
# Components:
#  - Prometheus: Time-series metrics engine with alerting & persistent storage
#  - Loki & Promtail: Centralized log aggregation with index retention
#  - Grafana: Unified visualization with pre-configured cross-datasource linking
#  - Jaeger: Distributed tracing with OpenTelemetry / Jaeger ingestion
#  - Kiali: Service mesh topology, health, and traffic visualization for Istio
# ==============================================================================

resource "kubernetes_namespace_v1" "observability" {
  metadata {
    name = var.namespace
    labels = {
      name                         = var.namespace
      "app.kubernetes.io/name"       = "observability"
      "app.kubernetes.io/part-of"    = "grocery-hub"
      "app.kubernetes.io/managed-by" = "terraform"
      # Disable Istio sidecar injection on observability to prevent circular telemetry loops
      "istio-injection"              = "disabled"
    }
  }
}

# ------------------------------------------------------------------------------
# 1. Prometheus Stack
# ------------------------------------------------------------------------------
resource "helm_release" "prometheus" {
  depends_on       = [kubernetes_namespace_v1.observability]
  name             = "prometheus"
  repository       = "https://prometheus-community.github.io/helm-charts"
  chart            = "prometheus"
  namespace        = kubernetes_namespace_v1.observability.metadata[0].name
  create_namespace = false
  version          = "29.36.1"
  upgrade_install  = true
  cleanup_on_fail  = true
  max_history      = 5
  timeout          = 900

  values = [
    yamlencode({
      fullnameOverride = "prometheus"

      server = {
        retention     = var.prometheus_retention
        retentionSize = var.prometheus_retention_size

        extraArgs = {
          "storage.tsdb.wal-compression" = ""
        }

        persistentVolume = {
          enabled      = var.enable_persistence
          storageClass = var.storage_class
          size         = var.prometheus_storage_size
          accessModes  = ["ReadWriteOnce"]
        }

        service = {
          type     = "NodePort"
          nodePort = var.prometheus_node_port
        }

        resources = {
          requests = {
            cpu    = "250m"
            memory = "512Mi"
          }
          limits = {
            cpu    = "1000m"
            memory = "2Gi"
          }
        }

        securityContext = {
          runAsUser    = 65534
          runAsNonRoot = true
          fsGroup      = 65534
        }

        podDisruptionBudget = {
          enabled      = true
          minAvailable = 1
        }
      }

      alertmanager = {
        enabled = true

        persistentVolume = {
          enabled      = var.enable_persistence
          storageClass = var.storage_class
          size         = var.alertmanager_storage_size
          accessModes  = ["ReadWriteOnce"]
        }

        resources = {
          requests = {
            cpu    = "50m"
            memory = "64Mi"
          }
          limits = {
            cpu    = "200m"
            memory = "256Mi"
          }
        }
      }

      alertmanagerFiles = {
        "alertmanager.yml" = {
          global = {
            resolve_timeout = "5m"
          }
          route = {
            group_by        = ["alertname", "namespace", "job"]
            group_wait      = "30s"
            group_interval  = "5m"
            repeat_interval = "4h"
            receiver        = "default-receiver"
            routes = [
              {
                match = {
                  severity = "critical"
                }
                receiver = "critical-alerts"
              }
            ]
          }
          inhibit_rules = [
            {
              source_match = {
                alertname = "KubeNodeNotReady"
              }
              target_match_re = {
                alertname = "PodCrashLooping|ContainerHighCpuUsage|ContainerHighMemoryUsage"
              }
              equal = ["node"]
            }
          ]
          receivers = [
            {
              name = "default-receiver"
            },
            {
              name = "critical-alerts"
            }
          ]
        }
      }

      serverFiles = {
        "alerting_rules.yml" = {
          groups = [
            {
              name = "groceryhub-production-alerts"
              rules = [
                # --- Cluster & Infrastructure Alerts ---
                {
                  alert = "KubeNodeNotReady"
                  expr  = "kube_node_status_condition{condition=\"Ready\",status=\"true\"} == 0"
                  for   = "2m"
                  labels = {
                    severity = "critical"
                  }
                  annotations = {
                    summary     = "Kubernetes Node {{ $labels.node }} is Not Ready"
                    description = "Node {{ $labels.node }} has been in a non-ready state for more than 2 minutes."
                  }
                },
                {
                  alert = "HostDiskSpaceFillingUp"
                  expr  = "(node_filesystem_avail_bytes{fstype!=\"\"} / node_filesystem_size_bytes{fstype!=\"\"}) * 100 < 15"
                  for   = "5m"
                  labels = {
                    severity = "warning"
                  }
                  annotations = {
                    summary     = "Node disk space is low (< 15%) on {{ $labels.instance }}"
                    description = "Disk utilization on {{ $labels.mountpoint }} has exceeded 85%."
                  }
                },
                # --- Workload & Pod Health Alerts ---
                {
                  alert = "PodCrashLooping"
                  expr  = "rate(kube_pod_container_status_restarts_total{namespace=~\"grocery-.*\"}[5m]) * 300 > 2"
                  for   = "2m"
                  labels = {
                    severity = "critical"
                  }
                  annotations = {
                    summary     = "Pod {{ $labels.pod }} is crash looping"
                    description = "Pod {{ $labels.pod }} in namespace {{ $labels.namespace }} restarted more than 2 times in 5 minutes."
                  }
                },
                {
                  alert = "PodOOMKilled"
                  expr  = "kube_pod_container_status_last_terminated_reason{reason=\"OOMKilled\",namespace=~\"grocery-.*\"} == 1"
                  for   = "1m"
                  labels = {
                    severity = "critical"
                  }
                  annotations = {
                    summary     = "Container {{ $labels.container }} in Pod {{ $labels.pod }} was OOMKilled"
                    description = "Pod {{ $labels.pod }} exceeded memory limit and was killed by the kernel."
                  }
                },
                {
                  alert = "ContainerHighCpuUsage"
                  expr  = "sum(rate(container_cpu_usage_seconds_total{container!=\"\", namespace=~\"grocery-.*\"}[5m])) by (pod, namespace) / sum(kube_pod_container_resource_limits{resource=\"cpu\", namespace=~\"grocery-.*\"}) by (pod, namespace) * 100 > 85"
                  for   = "5m"
                  labels = {
                    severity = "warning"
                  }
                  annotations = {
                    summary     = "Container CPU > 85% on {{ $labels.pod }}"
                    description = "CPU utilization is sustained above 85% for 5 minutes."
                  }
                },
                {
                  alert = "ContainerHighMemoryUsage"
                  expr  = "sum(container_memory_working_set_bytes{container!=\"\", namespace=~\"grocery-.*\"}) by (pod, namespace) / sum(kube_pod_container_resource_limits{resource=\"memory\", namespace=~\"grocery-.*\"}) by (pod, namespace) * 100 > 85"
                  for   = "5m"
                  labels = {
                    severity = "warning"
                  }
                  annotations = {
                    summary     = "Container Memory > 85% on {{ $labels.pod }}"
                    description = "Memory utilization is sustained above 85% for 5 minutes."
                  }
                },
                # --- Service Mesh & Ingress Traffic Alerts ---
                {
                  alert = "HighHttp5xxErrorRate"
                  expr  = "sum(rate(istio_requests_total{reporter=\"destination\", response_code=~\"5.*\"}[2m])) by (destination_workload, destination_workload_namespace) / (sum(rate(istio_requests_total{reporter=\"destination\"}[2m])) by (destination_workload, destination_workload_namespace) + 0.001) * 100 > 5"
                  for   = "2m"
                  labels = {
                    severity = "critical"
                  }
                  annotations = {
                    summary     = "High HTTP 5xx error rate on {{ $labels.destination_workload }}"
                    description = "HTTP 5xx error rate exceeded 5% for more than 2 minutes."
                  }
                },
                {
                  alert = "HighHttp4xxClientErrorRate"
                  expr  = "sum(rate(istio_requests_total{reporter=\"destination\", response_code=~\"4.*\"}[5m])) by (destination_workload, destination_workload_namespace) / (sum(rate(istio_requests_total{reporter=\"destination\"}[5m])) by (destination_workload, destination_workload_namespace) + 0.001) * 100 > 20"
                  for   = "5m"
                  labels = {
                    severity = "warning"
                  }
                  annotations = {
                    summary     = "High HTTP 4xx error rate on {{ $labels.destination_workload }}"
                    description = "Client HTTP 4xx rate exceeded 20% for 5 minutes."
                  }
                },
                {
                  alert = "HighLatencyP95"
                  expr  = "histogram_quantile(0.95, sum(rate(istio_request_duration_milliseconds_bucket{reporter=\"destination\"}[5m])) by (le, destination_workload)) > 2000"
                  for   = "3m"
                  labels = {
                    severity = "warning"
                  }
                  annotations = {
                    summary     = "High p95 response latency on {{ $labels.destination_workload }}"
                    description = "p95 latency is exceeding 2000ms."
                  }
                },
                {
                  alert = "IstioGatewayDown"
                  expr  = "kube_deployment_status_replicas_available{deployment=\"istio-gateway\",namespace=\"istio-gateway\"} == 0"
                  for   = "1m"
                  labels = {
                    severity = "critical"
                  }
                  annotations = {
                    summary     = "Istio Ingress Gateway is DOWN"
                    description = "No active replicas of Istio Gateway are available to serve incoming traffic."
                  }
                }
              ]
            }
          ]
        }
      }

      prometheus-node-exporter = {
        enabled = true
        resources = {
          requests = {
            cpu    = "50m"
            memory = "64Mi"
          }
          limits = {
            cpu    = "150m"
            memory = "128Mi"
          }
        }
      }

      kube-state-metrics = {
        enabled = true
        resources = {
          requests = {
            cpu    = "50m"
            memory = "64Mi"
          }
          limits = {
            cpu    = "150m"
            memory = "128Mi"
          }
        }
      }

      prometheus-pushgateway = {
        enabled = false
      }
    })
  ]
}

# ------------------------------------------------------------------------------
# 2. Loki & Promtail Stack (Log Aggregation)
# ------------------------------------------------------------------------------
resource "helm_release" "loki_stack" {
  depends_on       = [kubernetes_namespace_v1.observability]
  name             = "loki"
  repository       = "https://grafana.github.io/helm-charts"
  chart            = "loki-stack"
  namespace        = kubernetes_namespace_v1.observability.metadata[0].name
  create_namespace = false
  version          = "2.10.2"
  upgrade_install  = true
  cleanup_on_fail  = true
  max_history      = 5
  timeout          = 600

  values = [
    yamlencode({
      loki = {
        enabled = true

        persistence = {
          enabled          = var.enable_persistence
          storageClassName = var.storage_class
          size             = var.loki_storage_size
          accessModes      = ["ReadWriteOnce"]
        }

        config = {
          limits_config = {
            reject_old_samples                = true
            reject_old_samples_max_age        = "168h"
            max_entries_limit_per_query       = 5000
            max_query_length                  = "721h"
            max_query_parallelism             = 16
          }
          table_manager = {
            retention_deletes_enabled = true
            retention_period          = "168h"
          }
        }

        resources = {
          requests = {
            cpu    = "100m"
            memory = "256Mi"
          }
          limits = {
            cpu    = "500m"
            memory = "1Gi"
          }
        }
      }

      promtail = {
        enabled = true

        resources = {
          requests = {
            cpu    = "50m"
            memory = "64Mi"
          }
          limits = {
            cpu    = "200m"
            memory = "256Mi"
          }
        }
      }
    })
  ]
}

# ------------------------------------------------------------------------------
# 3. Jaeger (Distributed Tracing Engine)
# ------------------------------------------------------------------------------
resource "helm_release" "jaeger" {
  depends_on       = [kubernetes_namespace_v1.observability]
  name             = "jaeger"
  repository       = "https://jaegertracing.github.io/helm-charts"
  chart            = "jaeger"
  namespace        = kubernetes_namespace_v1.observability.metadata[0].name
  create_namespace = false
  version          = "4.14.1"
  upgrade_install  = true
  cleanup_on_fail  = true
  max_history      = 5
  wait             = true
  timeout          = 600

  values = [
    yamlencode({
      provisionDataStore = {
        cassandra = false
      }
      allInOne = {
        enabled = true
        args = [
          "--memory.max-traces=50000",
          "--query.base-path=/"
        ]
        resources = {
          requests = {
            cpu    = "100m"
            memory = "256Mi"
          }
          limits = {
            cpu    = "500m"
            memory = "1Gi"
          }
        }
      }
      query = {
        service = {
          type = "ClusterIP"
        }
      }
      collector = {
        service = {
          otlp = {
            grpc = {
              name = "otlp-grpc"
              port = 4317
            }
            http = {
              name = "otlp-http"
              port = 4318
            }
          }
        }
      }
    })
  ]
}

# Internal ClusterIP service for in-cluster queries & mesh integration
resource "kubernetes_service_v1" "jaeger_query" {
  metadata {
    name      = "jaeger-query"
    namespace = kubernetes_namespace_v1.observability.metadata[0].name
    labels = {
      "app.kubernetes.io/name"      = "jaeger"
      "app.kubernetes.io/component" = "query"
    }
  }
  spec {
    type = "ClusterIP"
    selector = {
      "app.kubernetes.io/name"      = "jaeger"
      "app.kubernetes.io/component" = "all-in-one"
      "app.kubernetes.io/instance"  = "jaeger"
    }
    port {
      name        = "http"
      port        = 80
      target_port = 16686
    }
    port {
      name        = "http-query"
      port        = 16686
      target_port = 16686
    }
    port {
      name        = "grpc-query"
      port        = 16685
      target_port = 16685
    }
  }
  depends_on = [helm_release.jaeger]
}

# External NodePort service for host access
resource "kubernetes_service_v1" "jaeger_nodeport" {
  metadata {
    name      = "jaeger-query-nodeport"
    namespace = kubernetes_namespace_v1.observability.metadata[0].name
    labels = {
      "app.kubernetes.io/name"      = "jaeger"
      "app.kubernetes.io/component" = "query-nodeport"
    }
  }
  spec {
    type = "NodePort"
    selector = {
      "app.kubernetes.io/name"      = "jaeger"
      "app.kubernetes.io/component" = "all-in-one"
      "app.kubernetes.io/instance"  = "jaeger"
    }
    port {
      name        = "http-query"
      port        = 16686
      target_port = 16686
      node_port   = var.jaeger_node_port
    }
  }
  depends_on = [helm_release.jaeger]
}

# ------------------------------------------------------------------------------
# 4. Grafana (Unified Visualization Dashboard)
# ------------------------------------------------------------------------------
resource "helm_release" "grafana" {
  depends_on       = [helm_release.prometheus, helm_release.loki_stack, helm_release.jaeger]
  name             = "grafana"
  repository       = "https://grafana-community.github.io/helm-charts"
  chart            = "grafana"
  namespace        = kubernetes_namespace_v1.observability.metadata[0].name
  create_namespace = false
  version          = "13.5.0"
  upgrade_install  = true
  cleanup_on_fail  = true
  max_history      = 5
  wait             = true
  timeout          = 600

  values = [
    yamlencode({
      fullnameOverride = "grafana"

      service = {
        type     = "NodePort"
        nodePort = var.grafana_node_port
      }

      persistence = {
        enabled          = var.enable_persistence
        storageClassName = var.storage_class
        size             = var.grafana_storage_size
        accessModes      = ["ReadWriteOnce"]
      }

      adminPassword = var.grafana_admin_password

      testFramework = {
        enabled = false
      }

      resources = {
        requests = {
          cpu    = "100m"
          memory = "128Mi"
        }
        limits = {
          cpu    = "500m"
          memory = "512Mi"
        }
      }

      securityContext = {
        runAsUser    = 472
        runAsGroup   = 472
        fsGroup      = 472
        runAsNonRoot = true
      }

      "grafana.ini" = {
        "auth.anonymous" = {
          enabled  = var.grafana_anonymous_access
          org_role = "Viewer"
        }
        analytics = {
          check_for_updates = false
        }
      }

      env = {
        JAEGER_AGENT_PORT = "6831"
      }

      # Sidecar for dynamic dashboard discovery from ConfigMaps
      sidecar = {
        dashboards = {
          enabled         = true
          label           = "grafana_dashboard"
          folder          = "/tmp/dashboards"
          searchNamespace = "ALL"
        }
      }

      # Pre-configured unified datasources with derived-field trace linking
      datasources = {
        "datasources.yaml" = {
          apiVersion = 1
          datasources = [
            # 1. Prometheus Metrics Engine
            {
              name      = "Prometheus"
              type      = "prometheus"
              url       = "http://prometheus-server:80"
              access    = "proxy"
              isDefault = true
              jsonData = {
                timeInterval = "15s"
                httpMethod   = "POST"
              }
            },
            # 2. Loki Logs Engine with automatic traceID deep-linking to Jaeger
            {
              name      = "Loki"
              type      = "loki"
              url       = "http://loki:3100"
              access    = "proxy"
              isDefault = false
              jsonData = {
                maxLines = 1000
                derivedFields = [
                  {
                    datasourceUid = "jaeger"
                    matcherRegex  = "(?:trace_id|traceId|traceID|trace)[=:\"]+([a-fA-F0-9]{16,32})"
                    name          = "TraceID"
                    url           = "$${__value.raw}"
                  }
                ]
              }
            },
            # 3. Jaeger Tracing Engine
            {
              name      = "Jaeger"
              type      = "jaeger"
              uid       = "jaeger"
              url       = "http://jaeger-query:16686"
              access    = "proxy"
              isDefault = false
            }
          ]
        }
      }
    })
  ]
}

# ------------------------------------------------------------------------------
# 5. Kiali (Istio Service Mesh Console)
# ------------------------------------------------------------------------------
resource "helm_release" "kiali" {
  depends_on       = [helm_release.prometheus, helm_release.grafana, helm_release.jaeger, kubernetes_service_v1.jaeger_query]
  name             = "kiali"
  repository       = "https://kiali.org/helm-charts"
  chart            = "kiali-server"
  namespace        = kubernetes_namespace_v1.observability.metadata[0].name
  create_namespace = false
  version          = "2.33.0"
  upgrade_install  = true
  cleanup_on_fail  = true
  force_update     = true
  max_history      = 5
  timeout          = 600

  values = [
    yamlencode({
      istio_namespace = "istio-system"

      auth = {
        strategy = "anonymous"
      }

      server = {
        web_root = "/"
      }

      deployment = {
        accessible_namespaces = ["**"]
        resources = {
          requests = {
            cpu    = "100m"
            memory = "128Mi"
          }
          limits = {
            cpu    = "500m"
            memory = "512Mi"
          }
        }
        additional_service_yaml = {
          type = "NodePort"
          ports = [
            {
              name     = "http"
              port     = 20001
              nodePort = var.kiali_node_port
            }
          ]
        }
      }

      external_services = {
        prometheus = {
          url = "http://prometheus-server.${var.namespace}.svc.cluster.local:80"
        }
        grafana = {
          enabled        = true
          in_cluster_url = "http://grafana.${var.namespace}.svc.cluster.local:80"
          url            = "http://localhost:${var.grafana_host_port}"
        }
        tracing = {
          enabled      = true
          provider     = "jaeger"
          use_grpc     = true
          grpc_port    = 16685
          internal_url = "http://jaeger-query.${var.namespace}.svc.cluster.local:16685"
          external_url = "http://localhost:${var.jaeger_host_port}"
        }
      }
    })
  ]
}
