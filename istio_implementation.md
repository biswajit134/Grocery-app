# Istio Service Mesh Implementation for GroceryHub

Implementing Istio for GroceryHub will provide advanced traffic management, zero-trust security (mTLS), and deep observability without needing to change your application code.

## 🏗️ Istio Architecture Strategy

1. **Ingress Gateway**: An Istio `Gateway` will sit at the edge, terminating TLS and acting as the single entry point.
2. **Traffic Routing**: `VirtualService` resources will route traffic to the appropriate frontends or your `api-gateway`.
3. **mTLS (Mutual TLS)**: `PeerAuthentication` will enforce encrypted communication between all microservices.
4. **Zero-Trust Networking**: `AuthorizationPolicy` will restrict service-to-service communication (e.g., the frontends can *only* talk to the API gateway, not directly to the database).
5. **Resilience**: `DestinationRule` will define circuit breaking and outlier detection.

---

## 📄 Core Istio Manifests

### 1. Ingress Gateway
This exposes the cluster to the outside world on HTTP (80) and HTTPS (443).

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: Gateway
metadata:
  name: groceryhub-gateway
  namespace: groceryhub
spec:
  selector:
    istio: ingressgateway # Default Istio ingress controller
  servers:
  - port:
      number: 80
      name: http
      protocol: HTTP
    hosts:
    - "groceryhub.com"
    # Redirect HTTP to HTTPS
    tls:
      httpsRedirect: true 
  - port:
      number: 443
      name: https
      protocol: HTTPS
    hosts:
    - "groceryhub.com"
    tls:
      mode: SIMPLE
      credentialName: groceryhub-cert-secret # K8s secret containing TLS certs
```

### 2. Main Routing (Virtual Service)
This handles path-based routing. It acts similarly to your current Nginx setup but at the cluster level.

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: groceryhub-routing
  namespace: groceryhub
spec:
  hosts:
  - "groceryhub.com"
  gateways:
  - groceryhub-gateway
  http:
  # 1. API Traffic -> API Gateway
  - match:
    - uri:
        prefix: /api/
    route:
    - destination:
        host: api-gateway
        port:
          number: 5000

  # 2. Admin Portal
  - match:
    - uri:
        prefix: /admin
    route:
    - destination:
        host: admin-app
        port:
          number: 3003

  # 3. Vendor Portal
  - match:
    - uri:
        prefix: /vendor
    route:
    - destination:
        host: vendor-app
        port:
          number: 3002

  # 4. Delivery Portal
  - match:
    - uri:
        prefix: /delivery
    route:
    - destination:
        host: delivery-app
        port:
          number: 3001

  # 5. Customer Storefront (Catch-all)
  - route:
    - destination:
        host: frontend-app
        port:
          number: 3000
```

### 3. Enforce STRICT mTLS
This ensures all communication *inside* the cluster is encrypted and authenticated.

```yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: groceryhub
spec:
  mtls:
    mode: STRICT
```

### 4. Zero-Trust Authorization Policies
This prevents lateral movement. If a frontend container is compromised, it cannot query the MongoDB database directly.

```yaml
# Allow frontend apps to ONLY talk to API Gateway
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: allow-frontends-to-gateway
  namespace: groceryhub
spec:
  selector:
    matchLabels:
      app: api-gateway
  rules:
  - from:
    - source:
        principals:
        - "cluster.local/ns/groceryhub/sa/frontend-sa"
        - "cluster.local/ns/groceryhub/sa/admin-sa"
        - "cluster.local/ns/groceryhub/sa/vendor-sa"
        - "cluster.local/ns/groceryhub/sa/delivery-sa"

---
# Allow API Gateway to talk to Microservices
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: allow-gateway-to-services
  namespace: groceryhub
spec:
  selector:
    matchLabels:
      tier: backend-services # Apply this label to auth, product, and order services
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/groceryhub/sa/api-gateway-sa"]
```

### 5. Circuit Breaking (Destination Rule)
Protect your backend services from cascading failures if they get overwhelmed by traffic.

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: order-service-resilience
  namespace: groceryhub
spec:
  host: order-service
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 10
        maxRequestsPerConnection: 10
    outlierDetection:
      consecutive5xxErrors: 3
      interval: 10s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
```

---

## 🚀 Migration Strategy

To move your `docker-compose` setup to Istio:

1. **Write standard K8s deployments & services** for all your containers.
2. **Enable Istio Sidecar Injection** on your namespace:
   ```bash
   kubectl label namespace groceryhub istio-injection=enabled
   ```
3. Deploy your apps. Istio will automatically inject Envoy proxy sidecars into every pod.
4. Apply the `Gateway` and `VirtualService` manifests to route external traffic.
5. **(Optional Optimization)**: Since Istio's VirtualService is an incredibly powerful router, you could potentially completely remove your `api-gateway` Node.js service (if it only does routing) and have Istio route `/api/auth` directly to the `auth-service`!
