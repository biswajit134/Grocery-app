# GroceryHub Architecture

This document outlines the end-to-end architecture of the GroceryHub application running on a local Kubernetes (Kind) cluster.

## Architecture Flowchart

```mermaid
flowchart TD
    User((You / Browser))

    subgraph Cluster [Kubernetes Cluster: kind-cilium]
        direction TB
        
        subgraph Networking [1. Networking & Traffic]
            Cilium[Cilium eBPF CNI]
            MetalLB[MetalLB Load Balancer]
            Istio[Istio Ingress Gateway]
        end

        subgraph ClientApps [2. Frontend Client Apps]
            Frontend[Frontend App UI]
            Admin[Admin Dashboard]
            Vendor[Vendor Portal]
            Delivery[Delivery App]
        end

        subgraph BackendServices [3. Backend Microservices]
            Auth[Auth Service]
            Product[Product Service]
            Order[Order Service]
        end

        subgraph Databases [4. Databases]
            Mongo[(MongoDB)]
            Redis[(Redis Cache)]
        end

        subgraph Observability [5. Monitoring & Observability]
            Prometheus[Prometheus]
            Grafana[Grafana]
            Jaeger[Jaeger]
            Kiali[Kiali]
            Hubble[Hubble UI]
        end
        
        %% Traffic Flow
        Istio ==>|Path: / | Frontend
        Istio ==>|Path: /admin| Admin
        Istio ==>|Path: /vendor| Vendor
        Istio ==>|Path: /delivery-partner| Delivery
        
        Istio ==>|Path: /api/auth| Auth
        Istio ==>|Path: /api/products| Product
        Istio ==>|Path: /api/orders| Order

        Auth -.->|Reads/Writes| Mongo
        Product -.->|Reads/Writes| Mongo
        Product -.->|Caches data| Redis
        Order -.->|Reads/Writes| Mongo
        Order -.->|Caches data| Redis
        
    end

    User ===>|Visits http://localhost:31000| Istio
```

## How It Works (In Plain English)

1. **You (The User):** When you type `http://localhost:31000` in your browser, the request is sent to your local Kubernetes cluster.
2. **The Front Door (Istio):** The request hits the **Istio Ingress Gateway**. Think of Istio as a traffic cop. It looks at the URL path you typed in.
3. **Routing to the Frontends:** If you just go to `/`, Istio sends you to the **Frontend App**. If you go to `/admin`, it sends you to the **Admin Dashboard**, and so on.
4. **Routing to the Backends:** When the frontend apps need data (like a list of groceries or to log you in), they send a request to `/api/...`. Istio sees the `/api/` path and routes it directly to the correct **Backend Microservice** (Auth, Product, or Order).
5. **Saving Data:** The backend microservices talk to **MongoDB** to permanently save data, and use **Redis** to temporarily cache data so the app loads faster.
6. **Under the Hood:** **Cilium** handles all the invisible networking between the pods, and tools like **Grafana** and **Prometheus** watch the cluster to make sure everything is healthy.
