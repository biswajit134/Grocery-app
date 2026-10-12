# ArgoCD Grocery App GitOps Module

This Terraform module registers and deploys the **GroceryHub** application stack (`grocery-database`, `grocery-backend`, and `grocery-clint`) using **ArgoCD** following GitOps principles and phased sync waves.

---

## 🏗️ Architecture & Sync Waves

ArgoCD synchronizes the applications in three sequential **Sync Waves** to guarantee clean startup order without race conditions:

```
┌─────────────────────────────────────────────────────────────┐
│                       ArgoCD Server                         │
└──────────────────────────────┬──────────────────────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼ (Wave 1)              ▼ (Wave 2)              ▼ (Wave 3)
┌──────────────────────┐┌──────────────────────┐┌──────────────────────┐
│   grocery-database   ││   grocery-backend    ││    grocery-clint     │
│ (MongoDB + Redis)    ││ (Auth, Product,      ││ (Admin, Vendor,      │
│                      ││  Order, Gateway)     ││  Delivery, Frontend) │
└──────────────────────┘└──────────────────────┘└──────────────────────┘
```

1. **Wave 1 (`grocery-database`)**:
   - Deploys MongoDB StatefulSet with persistent storage and Redis caching deployment into `grocery-database` namespace.
2. **Wave 2 (`grocery-backend`)**:
   - Deploys microservices (Auth on 5001, Product on 5002, Order on 5003, and API Gateway on 5000) into `grocery-backend` namespace.
   - Microservices can immediately connect to MongoDB (`mongodb-svc`) and Redis (`redis-svc`).
3. **Wave 3 (`grocery-clint`)**:
   - Deploys frontend applications (Frontend UI on 3000, Delivery Partner on 3001, Vendor Portal on 3002, Admin Dashboard on 3003) into `grocery-clint` namespace.

---

## 📦 Directory Structure

```
DevOps/modules/ArgoCD-grocery-app/
├── applications/
│   ├── grocery-database.yaml     # Standalone ArgoCD Application CR for database
│   ├── grocery-backend.yaml      # Standalone ArgoCD Application CR for backend
│   ├── grocery-clint.yaml        # Standalone ArgoCD Application CR for client apps
│   └── root-app-of-apps.yaml     # App-of-Apps root application manifest
├── templates/
│   └── application.yaml.tpl      # Dynamic parameterized template for Terraform
├── main.tf                       # Terraform kubectl_manifest resources & namespace labeling
├── variables.tf                  # Configuration inputs (repo_url, target_revision, sync policies)
├── outputs.tf                    # Module outputs (app details, target namespaces)
├── versions.tf                   # Provider constraints (kubectl, kubernetes)
└── README.md
```

---

## 🚀 Usage

### Option A: Using Terraform (Recommended)

Include the module in your root `main.tf`:

```hcl
module "argocd_grocery_app" {
  source     = "./modules/ArgoCD-grocery-app"
  repo_url   = "https://github.com/biswajit134/Grocery-app.git"
  target_revision = "HEAD"

  depends_on = [module.argocd]
}
```

Apply via Terraform:
```bash
terraform apply
```

### Option B: Using `kubectl` Directly

You can also apply the standalone application manifests directly:

```bash
# Apply individual applications
kubectl apply -f DevOps/modules/ArgoCD-grocery-app/applications/grocery-database.yaml
kubectl apply -f DevOps/modules/ArgoCD-grocery-app/applications/grocery-backend.yaml
kubectl apply -f DevOps/modules/ArgoCD-grocery-app/applications/grocery-clint.yaml

# Or apply as App-of-Apps root:
kubectl apply -f DevOps/modules/ArgoCD-grocery-app/applications/root-app-of-apps.yaml
```

---

## 🌐 ArgoCD Dashboard Access

ArgoCD web interface is exposed locally via NodePort:
- **URL**: [http://localhost:31006](http://localhost:31006)
- **Username**: `admin`
- **Password**: configured in `var.ARGOCD_PASSWORD` (default: `admin`)
