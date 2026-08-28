# GroceryHub — Kubernetes Deployment Guide

This guide walks you through deploying the GroceryHub microservices application to a Kubernetes cluster using the manifest files in the `k8s/` directory.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Directory Structure](#directory-structure)
- [Step-by-Step Deployment](#step-by-step-deployment)
  - [Step 1: Create Namespaces](#step-1-create-namespaces)
  - [Step 2: Deploy Secrets](#step-2-deploy-secrets)
  - [Step 3: Deploy ConfigMaps](#step-3-deploy-configmaps)
  - [Step 4: Deploy Database Layer](#step-4-deploy-database-layer)
  - [Step 5: Deploy Backend Services](#step-5-deploy-backend-services)
  - [Step 6: Deploy Client Applications](#step-6-deploy-client-applications)
  - [Step 7: Deploy Network Policies](#step-7-deploy-network-policies)
  - [Step 8: Deploy Horizontal Pod Autoscalers](#step-8-deploy-horizontal-pod-autoscalers)
  - [Step 9: Deploy Ingress](#step-9-deploy-ingress)
- [One-Command Deployment](#one-command-deployment)
- [Verification](#verification)
- [Accessing the Application](#accessing-the-application)
- [Scaling](#scaling)
- [Troubleshooting](#troubleshooting)
- [Cleanup](#cleanup)

---

## Prerequisites

Before deploying, ensure you have the following:

| Requirement | Minimum Version | Check Command |
|---|---|---|
| Kubernetes cluster | v1.25+ | `kubectl version` |
| kubectl CLI | v1.25+ | `kubectl version --client` |
| NGINX Ingress Controller | v1.0+ | `kubectl get pods -n ingress-nginx` |
| Metrics Server (for HPA) | v0.6+ | `kubectl top nodes` |

### Install NGINX Ingress Controller (if not installed)

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/cloud/deploy.yaml
```

### Install Metrics Server (if not installed, required for HPA)

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

> **Note:** For local clusters (minikube, kind), the metrics server may need `--kubelet-insecure-tls` flag.

---

## Architecture Overview

```
                         ┌─────────────────────────────────────────────┐
                         │              NGINX Ingress                  │
                         │    groceryhub.local (port 80)               │
                         └────┬──────┬──────┬──────┬──────┬───────────┘
                              │      │      │      │      │
                    ┌─────────┘      │      │      │      └──────────┐
                    │                │      │      │                 │
              ┌─────▼─────┐   ┌─────▼──┐ ┌─▼────┐ ┌▼────────┐ ┌────▼────┐
              │ Frontend   │   │ Admin  │ │Vendor│ │Delivery  │ │API GW   │
              │ :3000      │   │ :3003  │ │:3002 │ │:3001     │ │:5000    │
              └────────────┘   └────────┘ └──────┘ └──────────┘ └────┬────┘
              ─ ─ ─ ─ ─ ─ ─ ─ ─ client namespace ─ ─ ─ ─ ─ ─ ─     │
                                                           backend ns│
                                          ┌──────────────────────────┤
                                          │              │           │
                                    ┌─────▼─────┐ ┌─────▼──┐ ┌──────▼──┐
                                    │Auth Service│ │Product │ │Order    │
                                    │:5001       │ │:5002   │ │:5003    │
                                    └──────┬─────┘ └──┬──┬──┘ └────┬───┘
                                           │          │  │         │
              ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│─ ─ ─ ─ ─│─ │─ ─ ─ ─ │─ ─ ─
                                    database namespace│  │         │
                                          ┌───────────┘  │         │
                                          │              │         │
                                    ┌─────▼─────┐ ┌─────▼─────────▼─┐
                                    │  MongoDB   │ │     Redis       │
                                    │  :27017    │ │     :6379       │
                                    └────────────┘ └─────────────────┘
```

### Namespace Isolation

| Namespace | Purpose | Services |
|---|---|---|
| `database` | Data stores | MongoDB, Redis |
| `backend` | API services | Auth, Product, Order, API Gateway |
| `client` | Frontend apps | Customer, Admin, Vendor, Delivery Partner |

---

## Directory Structure

```
k8s/
├── namespaces.yaml                     # 3 namespaces: database, backend, client
├── secrets/
│   └── app-secrets.yaml                # JWT_SECRET (base64 encoded)
├── configmaps/
│   ├── backend-config.yaml             # DB URIs, service URLs, ports
│   └── client-config.yaml              # VITE_* API URLs
├── database/
│   ├── mongodb-pvc.yaml                # 10Gi persistent volume claim
│   ├── mongodb-deployment.yaml         # MongoDB 6.0 deployment
│   ├── mongodb-service.yaml            # ClusterIP service
│   ├── redis-pvc.yaml                  # 2Gi persistent volume claim
│   ├── redis-deployment.yaml           # Redis Alpine deployment
│   └── redis-service.yaml              # ClusterIP service
├── backend/
│   ├── auth-service.yaml               # Deployment + Service (port 5001)
│   ├── product-service.yaml            # Deployment + Service (port 5002)
│   ├── order-service.yaml              # Deployment + Service (port 5003)
│   └── api-gateway.yaml               # Deployment + Service (port 5000)
├── client/
│   ├── frontend.yaml                   # Deployment + Service (port 3000)
│   ├── delivery-partner.yaml           # Deployment + Service (port 3001)
│   ├── vendor.yaml                     # Deployment + Service (port 3002)
│   └── admin.yaml                      # Deployment + Service (port 3003)
├── ingress/
│   └── ingress.yaml                    # NGINX Ingress (client + API routes)
├── hpa/
│   └── backend-hpa.yaml               # Autoscalers for all backend services
├── network-policies/
│   └── cross-namespace.yaml            # Cross-namespace access rules
└── DEPLOY.md                           # This file
```

---

## Step-by-Step Deployment

> **Important:** Apply the manifests in the exact order listed below. Each step depends on the resources created in the previous step.

### Step 1: Create Namespaces

```bash
kubectl apply -f k8s/namespaces.yaml
```

**Verify:**
```bash
kubectl get namespaces | grep -E "database|backend|client"
```

Expected output:
```
backend    Active   <age>
client     Active   <age>
database   Active   <age>
```

---

### Step 2: Deploy Secrets

> **⚠️ WARNING:** Before deploying to production, update the JWT_SECRET in `k8s/secrets/app-secrets.yaml` with a strong, unique value.

To generate a new base64-encoded secret:
```bash
echo -n "your-strong-secret-key-here" | base64
```

Replace the `JWT_SECRET` value in the file, then apply:

```bash
kubectl apply -f k8s/secrets/app-secrets.yaml
```

**Verify:**
```bash
kubectl get secrets -n backend
```

---

### Step 3: Deploy ConfigMaps

```bash
kubectl apply -f k8s/configmaps/backend-config.yaml
kubectl apply -f k8s/configmaps/client-config.yaml
```

**Verify:**
```bash
kubectl get configmaps -n backend
kubectl get configmaps -n client
```

---

### Step 4: Deploy Database Layer

Deploy PVCs first, then deployments, then services:

```bash
# Persistent Volume Claims
kubectl apply -f k8s/database/mongodb-pvc.yaml
kubectl apply -f k8s/database/redis-pvc.yaml

# Deployments
kubectl apply -f k8s/database/mongodb-deployment.yaml
kubectl apply -f k8s/database/redis-deployment.yaml

# Services
kubectl apply -f k8s/database/mongodb-service.yaml
kubectl apply -f k8s/database/redis-service.yaml
```

**Verify — wait for pods to be Ready:**
```bash
kubectl get pods -n database -w
```

Expected output (wait until both show `1/1 Running`):
```
NAME                       READY   STATUS    RESTARTS   AGE
mongodb-xxxxxxxxxx-xxxxx   1/1     Running   0          30s
redis-xxxxxxxxxx-xxxxx     1/1     Running   0          30s
```

**Verify PVCs are Bound:**
```bash
kubectl get pvc -n database
```

---

### Step 5: Deploy Backend Services

> **Important:** Only proceed after MongoDB and Redis are in `Running` state.

```bash
kubectl apply -f k8s/backend/auth-service.yaml
kubectl apply -f k8s/backend/product-service.yaml
kubectl apply -f k8s/backend/order-service.yaml
kubectl apply -f k8s/backend/api-gateway.yaml
```

**Verify — wait for all pods to be Ready:**
```bash
kubectl get pods -n backend -w
```

Expected output (2 replicas each = 8 pods):
```
NAME                               READY   STATUS    RESTARTS   AGE
api-gateway-xxxxxxxxxx-xxxxx       1/1     Running   0          30s
api-gateway-xxxxxxxxxx-yyyyy       1/1     Running   0          30s
auth-service-xxxxxxxxxx-xxxxx      1/1     Running   0          30s
auth-service-xxxxxxxxxx-yyyyy      1/1     Running   0          30s
order-service-xxxxxxxxxx-xxxxx     1/1     Running   0          30s
order-service-xxxxxxxxxx-yyyyy     1/1     Running   0          30s
product-service-xxxxxxxxxx-xxxxx   1/1     Running   0          30s
product-service-xxxxxxxxxx-yyyyy   1/1     Running   0          30s
```

**Verify services:**
```bash
kubectl get services -n backend
```

---

### Step 6: Deploy Client Applications

```bash
kubectl apply -f k8s/client/frontend.yaml
kubectl apply -f k8s/client/delivery-partner.yaml
kubectl apply -f k8s/client/vendor.yaml
kubectl apply -f k8s/client/admin.yaml
```

**Verify:**
```bash
kubectl get pods -n client -w
```

Expected output (2 replicas each = 8 pods):
```
NAME                                READY   STATUS    RESTARTS   AGE
admin-xxxxxxxxxx-xxxxx              1/1     Running   0          30s
admin-xxxxxxxxxx-yyyyy              1/1     Running   0          30s
delivery-partner-xxxxxxxxxx-xxxxx   1/1     Running   0          30s
delivery-partner-xxxxxxxxxx-yyyyy   1/1     Running   0          30s
frontend-xxxxxxxxxx-xxxxx           1/1     Running   0          30s
frontend-xxxxxxxxxx-yyyyy           1/1     Running   0          30s
vendor-xxxxxxxxxx-xxxxx             1/1     Running   0          30s
vendor-xxxxxxxxxx-yyyyy             1/1     Running   0          30s
```

---

### Step 7: Deploy Network Policies

```bash
kubectl apply -f k8s/network-policies/cross-namespace.yaml
```

**Verify:**
```bash
kubectl get networkpolicies -A
```

---

### Step 8: Deploy Horizontal Pod Autoscalers

> **Prerequisite:** Metrics Server must be installed and running.

```bash
kubectl apply -f k8s/hpa/backend-hpa.yaml
```

**Verify:**
```bash
kubectl get hpa -n backend
```

Expected output:
```
NAME                  REFERENCE                    TARGETS           MINPODS   MAXPODS   REPLICAS   AGE
api-gateway-hpa       Deployment/api-gateway       <unknown>/70%     2         5         2          30s
auth-service-hpa      Deployment/auth-service      <unknown>/70%     2         5         2          30s
order-service-hpa     Deployment/order-service     <unknown>/70%     2         5         2          30s
product-service-hpa   Deployment/product-service   <unknown>/70%     2         5         2          30s
```

> **Note:** `<unknown>` is expected initially. It will show actual percentages once the Metrics Server starts collecting data (usually within 1-2 minutes).

---

### Step 9: Deploy Ingress

```bash
kubectl apply -f k8s/ingress/ingress.yaml
```

**Verify:**
```bash
kubectl get ingress -A
```

---

## One-Command Deployment

For convenience, you can deploy everything at once using this script:

```bash
#!/bin/bash
set -e

echo "=== GroceryHub K8s Deployment ==="

echo "[1/9] Creating namespaces..."
kubectl apply -f k8s/namespaces.yaml

echo "[2/9] Deploying secrets..."
kubectl apply -f k8s/secrets/

echo "[3/9] Deploying configmaps..."
kubectl apply -f k8s/configmaps/

echo "[4/9] Deploying database layer..."
kubectl apply -f k8s/database/
echo "    Waiting for databases to be ready..."
kubectl wait --for=condition=ready pod -l app=mongodb -n database --timeout=120s
kubectl wait --for=condition=ready pod -l app=redis -n database --timeout=120s

echo "[5/9] Deploying backend services..."
kubectl apply -f k8s/backend/
echo "    Waiting for backend services to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/part-of=groceryhub -n backend --timeout=180s

echo "[6/9] Deploying client applications..."
kubectl apply -f k8s/client/
echo "    Waiting for client apps to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/part-of=groceryhub -n client --timeout=120s

echo "[7/9] Deploying network policies..."
kubectl apply -f k8s/network-policies/

echo "[8/9] Deploying HPAs..."
kubectl apply -f k8s/hpa/

echo "[9/9] Deploying ingress..."
kubectl apply -f k8s/ingress/

echo ""
echo "=== Deployment Complete! ==="
echo ""
echo "Status:"
kubectl get pods -A -l app.kubernetes.io/part-of=groceryhub
```

Save this as `k8s/deploy.sh` and run:
```bash
chmod +x k8s/deploy.sh
./k8s/deploy.sh
```

---

## Verification

### Full Cluster Status

Check all resources across all namespaces:

```bash
# All pods
kubectl get pods -A -l app.kubernetes.io/part-of=groceryhub

# All services
kubectl get services -A -l app.kubernetes.io/part-of=groceryhub

# All deployments
kubectl get deployments -A -l app.kubernetes.io/part-of=groceryhub

# All HPAs
kubectl get hpa -n backend

# All ingress rules
kubectl get ingress -A

# All network policies
kubectl get networkpolicies -A
```

### Health Check Test

Test backend service health endpoints from within the cluster:

```bash
# Port-forward to API Gateway
kubectl port-forward -n backend svc/api-gateway 5000:5000

# In another terminal:
curl http://localhost:5000/health
```

### DNS Resolution Test

Verify cross-namespace DNS works:

```bash
# Run a debug pod
kubectl run dns-test --image=busybox:1.36 --rm -it --restart=Never -n backend -- nslookup mongodb.database.svc.cluster.local
```

---

## Accessing the Application

### Option 1: Using Ingress (Production)

Add the host entry to your `/etc/hosts` (or `C:\Windows\System32\drivers\etc\hosts` on Windows):

```bash
# Get the Ingress external IP
kubectl get ingress -n client groceryhub-ingress

# Add to /etc/hosts
<EXTERNAL-IP>  groceryhub.local
```

Then open in your browser:

| URL | Application |
|---|---|
| `http://groceryhub.local/` | Customer Frontend |
| `http://groceryhub.local/admin` | Admin Dashboard |
| `http://groceryhub.local/vendor` | Vendor Portal |
| `http://groceryhub.local/delivery` | Delivery Partner Portal |
| `http://groceryhub.local/api/auth` | Auth API |
| `http://groceryhub.local/api/products` | Products API |
| `http://groceryhub.local/api/orders` | Orders API |

### Option 2: Using Port-Forward (Local Development)

```bash
# Frontend
kubectl port-forward -n client svc/frontend 3000:3000

# Admin
kubectl port-forward -n client svc/admin 3003:3003

# API Gateway
kubectl port-forward -n backend svc/api-gateway 5000:5000
```

### Option 3: Using NodePort (Quick Access)

If you need external access without Ingress, temporarily change a service to NodePort:

```bash
kubectl patch svc frontend -n client -p '{"spec": {"type": "NodePort"}}'
kubectl get svc frontend -n client  # Note the NodePort assigned
```

---

## Scaling

### Manual Scaling

```bash
# Scale a deployment
kubectl scale deployment frontend -n client --replicas=3

# Scale backend services
kubectl scale deployment api-gateway -n backend --replicas=4
```

### Automatic Scaling (HPA)

The HPAs are already configured for backend services. Monitor autoscaling:

```bash
kubectl get hpa -n backend -w
```

---

## Troubleshooting

### Pod Not Starting

```bash
# Check pod events
kubectl describe pod <pod-name> -n <namespace>

# Check logs
kubectl logs <pod-name> -n <namespace>

# Check previous container logs (if crashed)
kubectl logs <pod-name> -n <namespace> --previous
```

### Common Issues

| Symptom | Likely Cause | Fix |
|---|---|---|
| `ImagePullBackOff` | Docker Hub rate limit or image not found | Verify image name, check Docker Hub credentials |
| `CrashLoopBackOff` | Application error on startup | Check logs: `kubectl logs <pod> -n <ns>` |
| `Pending` PVC | No StorageClass available | Create a default StorageClass or specify one in PVC |
| `Pending` pod | Insufficient cluster resources | Check node resources: `kubectl describe nodes` |
| HPA shows `<unknown>` | Metrics Server not installed | Install Metrics Server (see Prerequisites) |
| `Connection refused` cross-namespace | NetworkPolicy blocking traffic | Verify namespace labels match policy selectors |

### Checking Cross-Namespace Communication

```bash
# Verify namespace labels (required for NetworkPolicy)
kubectl get namespaces --show-labels

# Test connectivity from backend to database
kubectl exec -it <backend-pod> -n backend -- wget -qO- http://mongodb.database.svc.cluster.local:27017 --timeout=3
```

### Restart a Deployment

```bash
kubectl rollout restart deployment <deployment-name> -n <namespace>
```

---

## Cleanup

To remove all GroceryHub resources from the cluster:

```bash
# Delete in reverse order
kubectl delete -f k8s/ingress/
kubectl delete -f k8s/hpa/
kubectl delete -f k8s/network-policies/
kubectl delete -f k8s/client/
kubectl delete -f k8s/backend/
kubectl delete -f k8s/database/
kubectl delete -f k8s/configmaps/
kubectl delete -f k8s/secrets/
kubectl delete -f k8s/namespaces.yaml
```

> **⚠️ Warning:** Deleting the `database` namespace will also delete the PVCs and all stored data. Make sure to back up MongoDB data before cleanup if needed.

Or delete everything at once:

```bash
kubectl delete namespace database backend client
```
