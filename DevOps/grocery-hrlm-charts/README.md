# GroceryHub Production Helm Charts

This directory contains production-ready, standardized Helm charts for all tiers of the **GroceryHub** cloud-native platform on Kubernetes & Istio Service Mesh.

---

## 📁 Repository Structure

```tree
grocery-hrlm-charts/
├── grocery-client/               # Frontend Client applications chart
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
│       ├── _helpers.tpl
│       ├── deployments.yaml      # RollingUpdate, preStop hook, podAntiAffinity, probes
│       ├── services.yaml         # ClusterIP services for all 4 clients
│       ├── hpa.yaml              # HorizontalPodAutoscalers (autoscaling/v2)
│       ├── destination-rules.yaml# Istio DestinationRules (ROUND_ROBIN, circuit breaker)
│       ├── pdb.yaml              # PodDisruptionBudgets (minAvailable: 1)
│       ├── networkpolicy.yaml    # NetworkPolicy (Gateway -> Client -> Backend)
│       └── NOTES.txt
│
├── grocery-backend/              # Microservices backend chart
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
│       ├── _helpers.tpl
│       ├── configmap.yaml        # Service discovery URLs
│       ├── secret.yaml           # Fallback local secret
│       ├── backend-externalsecret.yaml # ExternalSecret pulling credentials from Vault
│       ├── deployments.yaml      # RollingUpdate, /health probes, env bindings
│       ├── services.yaml         # ClusterIP services for all 4 backend services
│       ├── hpa.yaml              # HorizontalPodAutoscalers (autoscaling/v2)
│       ├── destination-rules.yaml# Istio DestinationRules (LEAST_REQUEST, circuit breaker)
│       ├── pdb.yaml              # PodDisruptionBudgets (minAvailable: 1)
│       ├── networkpolicy.yaml    # Ingress/Egress isolation with DB and Istio control plane
│       └── NOTES.txt
│
└── grocery-database/             # Database and storage chart
    ├── Chart.yaml
    ├── values.yaml
    └── templates/
        ├── _helpers.tpl
        ├── storageclass.yaml     # Local-path dynamic storage class
        ├── mongodb-secret.yaml   # Fallback local secret
        ├── mongodb-externalsecret.yaml # ExternalSecret pulling credentials from Vault
        ├── mongodb-service.yaml  # MongoDB ClusterIP service (27017)
        ├── mongodb-statefulset.yaml # MongoDB StatefulSet with PVC template
        ├── redis-pvc.yaml        # PersistentVolumeClaim for Redis
        ├── redis-service.yaml    # Redis ClusterIP service (6379)
        ├── redis-deployment.yaml # Redis Deployment with PVC mount
        ├── pdb.yaml              # PodDisruptionBudgets for MongoDB & Redis
        ├── networkpolicy.yaml    # Isolates DB access exclusively to backend namespace
        └── NOTES.txt
```

---

## 🚀 Quick Deployment Guide

### 1. Database Tier
```bash
helm upgrade --install grocery-database ./grocery-database \
  --namespace grocery-database \
  --create-namespace
```

### 2. Backend Microservices Tier
```bash
helm upgrade --install grocery-backend ./grocery-backend \
  --namespace grocery-backend \
  --create-namespace
```

### 3. Frontend Client Apps Tier
```bash
helm upgrade --install grocery-client ./grocery-client \
  --namespace grocery-clint \
  --create-namespace
```

---

## 🛡️ Production Standards Implemented

| Category | Client Chart | Backend Chart | Database Chart |
|---|---|---|---|
| **Zero-Downtime Rollouts** | RollingUpdate (`maxSurge: 1`, `maxUnavailable: 0`) + `preStop` hook (`sleep 5`) | RollingUpdate (`maxSurge: 1`, `maxUnavailable: 0`) + `preStop` hook (`sleep 5`) | StatefulSet rolling update |
| **High Availability** | `podAntiAffinity` (preferred hostname) | `podAntiAffinity` (preferred hostname) | StatefulSet + PVC persistence |
| **Disruption Budgets** | PDB (`minAvailable: 1`) | PDB (`minAvailable: 1`) | PDB (`minAvailable: 1`) |
| **Autoscaling** | HPA (`min: 2`, `max: 5`, CPU 70%, Mem 80%) | HPA (`min: 2`, `max: 5`, CPU 70%, Mem 80%) | Vertical resources / persistence |
| **Istio Traffic Routing** | `ROUND_ROBIN` load balancing + Outlier detection | `LEAST_REQUEST` load balancing + Connection pooling + Circuit breaking | Istio sidecar compatible |
| **Health Checks** | Liveness & Readiness on `/` | Liveness & Readiness on `/health` (preventing 404 rollout stalls) | TCP Socket probes on 27017 & 6379 |
| **Zero-Trust Security** | NetworkPolicies restricting Ingress from Istio Gateway and Egress to API Gateway | NetworkPolicies isolating inter-service traffic and DB egress | NetworkPolicies permitting access **only** from backend namespace |
| **Decoupled Config** | Parameterized values | `ConfigMap` for discovery URLs + `Secret` for credentials | `Secret` for DB admin credentials |
