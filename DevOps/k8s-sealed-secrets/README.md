# Bitnami Sealed Secrets for ArgoCD GitOps

This directory provides the Bitnami Sealed Secrets implementation for the Grocery Hub Kubernetes cluster.

---

## 1. How Bitnami Sealed Secrets Works with ArgoCD

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DEVELOPER WORKFLOW                              │
│                                                                        │
│ 1. Plain Secret (Local only, NEVER committed):                         │
│    kubectl create secret generic mongodb-secret --dry-run=client ...   │
│                                │                                       │
│ 2. Encrypt with kubeseal:      ▼                                       │
│    kubeseal --fetch-cert (Public Key from Cluster)                     │
│                                │                                       │
│ 3. SealedSecret Manifest:      ▼                                       │
│    sealed-secret.yaml (Ciphertext, safe for Git)                       │
└────────────────────────────────┼───────────────────────────────────────┘
                                 │ git commit & push
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        ARGOCD GITOPS ENGINE                            │
│                                                                        │
│ 4. ArgoCD syncs Helm Chart / SealedSecret from Git to Kubernetes.      │
└────────────────────────────────┼───────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        KUBERNETES CLUSTER                              │
│                                                                        │
│ 5. SealedSecrets Controller (holds private key):                       │
│    - Decrypts SealedSecret manifest                                    │
│    - Generates native K8s Secret (mongodb-secret, backend-secret)      │
│                                                                        │
│ 6. Pods mount standard Secret without knowing it was encrypted!        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Sealed Secrets Implemented in Grocery Project

| Application | SealedSecret Name | Namespace | Generated Secret | Sensitive Keys |
|---|---|---|---|---|
| **grocery-database** | `mongodb-secret` | `grocery-database` | `mongodb-secret` | `MONGO_INITDB_ROOT_USERNAME`, `MONGO_INITDB_ROOT_PASSWORD` |
| **grocery-backend** | `backend-secret` | `grocery-backend` | `backend-secret` | `JWT_SECRET`, `AUTH_MONGO_URI`, `PRODUCT_MONGO_URI`, `ORDER_MONGO_URI` |

---

## 3. How to Seal New Secrets

You can use the automated script in `DevOps/scripts/seal-secret.ps1`:

### Example A: Seal using Key-Value Literals
```powershell
.\DevOps\scripts\seal-secret.ps1 `
  -SecretName "my-app-secret" `
  -Namespace "grocery-backend" `
  -Literals @{
    "API_TOKEN" = "my-secret-token-12345";
    "DB_PASS"   = "super-secure-pass"
  } `
  -OutputFile "DevOps/sealed-secrets/my-app-sealedsecret.yaml"
```

### Example B: Seal using native `kubeseal` CLI
```powershell
kubectl create secret generic backend-secret `
  --namespace grocery-backend `
  --from-literal=JWT_SECRET="supersecretjwtkeyforgroceryhub" `
  --dry-run=client -o yaml | `
  DevOps\bin\kubeseal.exe `
    --kubeconfig DevOps\modules\kind-cluster\kind-cilium-config `
    --controller-namespace kube-system `
    --controller-name sealed-secrets-controller `
    -o yaml > DevOps\sealed-secrets\backend-sealedsecret.yaml
```

---

## 4. Verifying Unsealed Secrets in the Cluster

Check the SealedSecret custom resource:
```powershell
kubectl get sealedsecrets -A
```

Check the unsealed native Secret:
```powershell
kubectl get secret mongodb-secret -n grocery-database
kubectl get secret backend-secret -n grocery-backend
```
