apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ${app_name}
  namespace: ${argocd_namespace}
  labels:
    app.kubernetes.io/part-of: groceryhub
    app.kubernetes.io/tier: ${tier}
  annotations:
    argocd.argoproj.io/sync-wave: "${sync_wave}"
spec:
  project: default
  source:
    repoURL: ${repo_url}
    targetRevision: ${target_revision}
    path: ${chart_path}
    helm:
      valueFiles:
        - values.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: ${destination_namespace}
%{ if enable_auto_sync ~}
  syncPolicy:
    automated:
      prune: ${enable_prune}
      selfHeal: ${enable_self_heal}
      allowEmpty: false
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
      - PruneLast=true
      - ApplyOutOfSyncOnly=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
%{ else ~}
  syncPolicy:
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
      - PruneLast=true
      - ApplyOutOfSyncOnly=true
%{ endif ~}
