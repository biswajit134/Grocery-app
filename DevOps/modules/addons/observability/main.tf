resource "kubernetes_namespace_v1" "observability" {
  metadata {
    name = var.namespace
    labels = {
      name = "observability"
    }
  }
}

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
  timeout          = 600

  values = [
    <<EOF
fullnameOverride: "prometheus"
server:
  persistentVolume:
    enabled: false
  retention: 15d
  service:
    type: NodePort
    nodePort: ${var.prometheus_node_port}

serverFiles:
  alerting_rules.yml:
    groups:
      - name: groceryhub-alerts
        rules:
          - alert: PodCrashLooping
            expr: rate(kube_pod_container_status_restarts_total{namespace=~"grocery-.*"}[5m]) * 300 > 2
            for: 2m
            labels:
              severity: critical
            annotations:
              summary: "Pod {{ $labels.pod }} is crash looping"
              description: "Pod {{ $labels.pod }} in namespace {{ $labels.namespace }} restarted more than 2 times in 5 minutes."

          - alert: HighHttp5xxErrorRate
            expr: sum(rate(istio_requests_total{reporter="destination", response_code=~"5.*"}[2m])) by (destination_workload, destination_workload_namespace) / (sum(rate(istio_requests_total{reporter="destination"}[2m])) by (destination_workload, destination_workload_namespace) + 0.001) * 100 > 5
            for: 2m
            labels:
              severity: critical
            annotations:
              summary: "High 5xx error rate on {{ $labels.destination_workload }}"
              description: "HTTP 5xx error rate exceeded 5% for more than 2 minutes."

          - alert: HighHttp4xxClientErrorRate
            expr: sum(rate(istio_requests_total{reporter="destination", response_code=~"4.*"}[5m])) by (destination_workload, destination_workload_namespace) / (sum(rate(istio_requests_total{reporter="destination"}[5m])) by (destination_workload, destination_workload_namespace) + 0.001) * 100 > 20
            for: 5m
            labels:
              severity: warning
            annotations:
              summary: "High 4xx error rate on {{ $labels.destination_workload }}"
              description: "HTTP 4xx error rate exceeded 20% for 5 minutes."

          - alert: HighLatencyP95
            expr: histogram_quantile(0.95, sum(rate(istio_request_duration_milliseconds_bucket{reporter="destination"}[5m])) by (le, destination_workload)) > 2000
            for: 3m
            labels:
              severity: warning
            annotations:
              summary: "High p95 response latency on {{ $labels.destination_workload }}"
              description: "p95 latency is exceeding 2 seconds."

          - alert: ContainerHighCpuUsage
            expr: sum(rate(container_cpu_usage_seconds_total{container!="", namespace=~"grocery-.*"}[5m])) by (pod, namespace) / sum(kube_pod_container_resource_limits{resource="cpu", namespace=~"grocery-.*"}) by (pod, namespace) * 100 > 85
            for: 5m
            labels:
              severity: warning
            annotations:
              summary: "Container CPU > 85% on {{ $labels.pod }}"
              description: "CPU usage is sustained above 85%."

          - alert: ContainerHighMemoryUsage
            expr: sum(container_memory_working_set_bytes{container!="", namespace=~"grocery-.*"}) by (pod, namespace) / sum(kube_pod_container_resource_limits{resource="memory", namespace=~"grocery-.*"}) by (pod, namespace) * 100 > 85
            for: 5m
            labels:
              severity: warning
            annotations:
              summary: "Container Memory > 85% on {{ $labels.pod }}"
              description: "Memory usage is sustained above 85%."

alertmanager:
  enabled: true
  persistentVolume:
    enabled: false

alertmanagerFiles:
  alertmanager.yml:
    global:
      resolve_timeout: 5m
    route:
      group_by: ['alertname', 'namespace']
      group_wait: 30s
      group_interval: 5m
      repeat_interval: 4h
      receiver: 'default-receiver'
      routes:
        - match:
            severity: critical
          receiver: 'critical-alerts'
    receivers:
      - name: 'default-receiver'
      - name: 'critical-alerts'

prometheus-node-exporter:
  enabled: true
kube-state-metrics:
  enabled: true
prometheus-pushgateway:
  enabled: false
EOF
  ]
}

resource "helm_release" "loki_stack" {
  depends_on       = [kubernetes_namespace_v1.observability]
  name             = "loki"
  repository       = "https://grafana.github.io/helm-charts"
  chart            = "loki-stack"
  namespace        = kubernetes_namespace_v1.observability.metadata[0].name
  create_namespace = false
  version          = "2.10.2"
  timeout          = 600

  values = [
    <<EOF
loki:
  enabled: true
  persistence:
    enabled: false
promtail:
  enabled: true
EOF
  ]
}

resource "helm_release" "grafana" {
  depends_on       = [helm_release.prometheus, helm_release.loki_stack]
  name             = "grafana"
  repository       = "https://grafana-community.github.io/helm-charts"
  chart            = "grafana"
  namespace        = kubernetes_namespace_v1.observability.metadata[0].name
  create_namespace = false
  version          = "13.5.0"
  wait             = true
  timeout          = 600

  values = [
    <<EOF
fullnameOverride: "grafana"
service:
  type: NodePort
  nodePort: ${var.grafana_node_port}
persistence:
  enabled: false
adminPassword: "${var.grafana_admin_password}"
testFramework:
  enabled: false
grafana.ini:
  auth.anonymous:
    enabled: true
    org_role: Viewer
env:
  JAEGER_AGENT_PORT: "6831"
datasources:
  datasources.yaml:
    apiVersion: 1
    datasources:
      - name: Prometheus
        type: prometheus
        url: http://prometheus-server:80
        access: proxy
        isDefault: true
      - name: Loki
        type: loki
        url: http://loki:3100
        access: proxy
        isDefault: false
EOF
  ]
}

resource "helm_release" "jaeger" {
  depends_on       = [kubernetes_namespace_v1.observability]
  name             = "jaeger"
  repository       = "https://jaegertracing.github.io/helm-charts"
  chart            = "jaeger"
  namespace        = kubernetes_namespace_v1.observability.metadata[0].name
  create_namespace = false
  version          = "4.14.1"
  wait             = true
  timeout          = 600
}

resource "kubernetes_service_v1" "jaeger_nodeport" {
  metadata {
    name      = "jaeger-query-nodeport"
    namespace = kubernetes_namespace_v1.observability.metadata[0].name
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

resource "kubernetes_service_v1" "jaeger_query" {
  metadata {
    name      = "jaeger-query"
    namespace = kubernetes_namespace_v1.observability.metadata[0].name
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

resource "helm_release" "kiali" {
  name             = "kiali"
  repository       = "https://kiali.org/helm-charts"
  force_update     = true
  chart            = "kiali-server"
  namespace        = kubernetes_namespace_v1.observability.metadata[0].name
  create_namespace = false
  version          = "2.33.0"
  timeout          = 600

  values = [
    <<EOF
istio_namespace: "istio-system"
auth:
  strategy: "anonymous"
server:
  web_root: "/"
deployment:
  accessible_namespaces:
    - "**"
  additional_service_yaml:
    type: NodePort
    ports:
      - name: http
        port: 20001
        nodePort: ${var.kiali_node_port}
external_services:
  prometheus:
    url: "http://prometheus-server.${var.namespace}.svc.cluster.local:80"
  grafana:
    enabled: true
    in_cluster_url: "http://grafana.${var.namespace}.svc.cluster.local:80"
    url: "http://localhost:${var.grafana_host_port}"
  tracing:
    enabled: true
    provider: "jaeger"
    use_grpc: true
    grpc_port: 16685
    internal_url: "http://jaeger-query.${var.namespace}.svc.cluster.local:16685"
    external_url: "http://localhost:${var.jaeger_host_port}"
EOF
  ]

  depends_on = [helm_release.prometheus, helm_release.grafana, helm_release.jaeger, kubernetes_service_v1.jaeger_query]
}
