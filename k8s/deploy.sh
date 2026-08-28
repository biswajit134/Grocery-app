#!/bin/bash
set -e

echo "========================================="
echo "  GroceryHub — Kubernetes Deployment"
echo "========================================="
echo ""

# Step 1: Namespaces
echo "[1/9] Creating namespaces (database, backend, client)..."
kubectl apply -f k8s/namespaces.yaml
echo "  ✓ Namespaces created"
echo ""

# Step 2: Secrets
echo "[2/9] Deploying secrets..."
kubectl apply -f k8s/secrets/
echo "  ✓ Secrets deployed"
echo ""

# Step 3: ConfigMaps
echo "[3/9] Deploying configmaps..."
kubectl apply -f k8s/configmaps/
echo "  ✓ ConfigMaps deployed"
echo ""

# Step 4: Database Layer
echo "[4/9] Deploying database layer (MongoDB + Redis)..."
kubectl apply -f k8s/database/
echo "  ⏳ Waiting for MongoDB to be ready..."
kubectl wait --for=condition=ready pod -l app=mongodb -n database --timeout=120s
echo "  ⏳ Waiting for Redis to be ready..."
kubectl wait --for=condition=ready pod -l app=redis -n database --timeout=120s
echo "  ✓ Database layer ready"
echo ""

# Step 5: Backend Services
echo "[5/9] Deploying backend services..."
kubectl apply -f k8s/backend/
echo "  ⏳ Waiting for backend services to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/part-of=groceryhub -n backend --timeout=180s
echo "  ✓ Backend services ready"
echo ""

# Step 6: Client Applications
echo "[6/9] Deploying client applications..."
kubectl apply -f k8s/client/
echo "  ⏳ Waiting for client apps to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/part-of=groceryhub -n client --timeout=120s
echo "  ✓ Client applications ready"
echo ""

# Step 7: Network Policies
echo "[7/9] Deploying network policies..."
kubectl apply -f k8s/network-policies/
echo "  ✓ Network policies deployed"
echo ""

# Step 8: HPAs
echo "[8/9] Deploying horizontal pod autoscalers..."
kubectl apply -f k8s/hpa/
echo "  ✓ HPAs deployed"
echo ""

# Step 9: Ingress
echo "[9/9] Deploying ingress..."
kubectl apply -f k8s/ingress/
echo "  ✓ Ingress deployed"
echo ""

echo "========================================="
echo "  ✅ Deployment Complete!"
echo "========================================="
echo ""
echo "📊 Cluster Status:"
echo ""
echo "--- Pods ---"
kubectl get pods -A -l app.kubernetes.io/part-of=groceryhub --no-headers | column -t
echo ""
echo "--- Services ---"
kubectl get services -A -l app.kubernetes.io/part-of=groceryhub --no-headers | column -t
echo ""
echo "--- Ingress ---"
kubectl get ingress -A --no-headers 2>/dev/null | column -t
echo ""
echo "🌐 Access the application:"
echo "   Frontend:  kubectl port-forward -n client svc/frontend 3000:3000"
echo "   Admin:     kubectl port-forward -n client svc/admin 3003:3003"
echo "   API:       kubectl port-forward -n backend svc/api-gateway 5000:5000"
echo ""
