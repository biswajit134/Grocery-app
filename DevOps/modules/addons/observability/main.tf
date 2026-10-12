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
  version          = "29.36.1" # using a recent stable version
  upgrade_install = true
  cleanup_on_fail = true
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
alertmanager:
  enabled: true
prometheus-node-exporter:
  enabled: true
kube-state-metrics:
  enabled: true
prometheus-pushgateway:
  enabled: false
EOF
  ]
}

resource "helm_release" "grafana" {
  depends_on       = [helm_release.prometheus]
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
adminPassword: "admin"
testFramework:
  enabled: false
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
    enabled: false
EOF
  ]

  depends_on = [helm_release.prometheus, helm_release.grafana, helm_release.jaeger]
}
