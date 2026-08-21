# 🍊 GroceryHub

Welcome to **GroceryHub**, a premium, modern, multi-user Grocery Platform featuring a synchronized logistics and order fulfillment lifecycle across all user portals. Built with **React** for client SPAs, styled using custom **Vanilla CSS** with a harmonious black-and-orange theme, and backed by a **Node.js/Express** microservices architecture orchestrated via **Docker Compose**.

---

## 🏗 Architecture

```mermaid
graph TD
    %% Frontend Applications
    subgraph Client Portals
        F(🛒 Customer Storefront<br>Port: 3000)
        D(🚚 Delivery Partner<br>Port: 3001)
        V(🏪 Vendor App<br>Port: 3002)
        A(📊 Admin Portal<br>Port: 3003)
    end

    %% API Gateway
    AG{API Gateway<br>Port: 5000}

    %% Microservices
    subgraph Backend Microservices
        Auth(Auth Service<br>Port: 5001)
        Product(Product Service<br>Port: 5002)
        Order(Order Service<br>Port: 5003)
    end

    %% Databases
    subgraph Databases
        Mongo[(MongoDB)]
        Redis[(Redis)]
    end

    %% Client to Gateway
    F --> AG
    D --> AG
    V --> AG
    A --> AG

    %% Gateway to Services
    AG --> Auth
    AG --> Product
    AG --> Order

    %% Internal Service Communication
    Order -.->|Verifies Products| Product

    %% Services to Databases
    Auth --> Mongo
    Product --> Mongo
    Order --> Mongo
    Product --> Redis
```

---

## 🎬 Platform Walkthrough & Live Transitions

Here is the live animation showing page loading, category navigation transitions, and the logged-in admin dashboard:


---

## 📸 Portal Screenshots

### 🛒 Customer Storefront (Port 3000)
Browse the catalog, filter categories, view discount pricing, and manage your cart.

#### Storefront Landing Page
![Customer Storefront Landing](assets/screenshots/storefront_landing_1781803620787.png)

#### Category Navigation (e.g. Fruits Catalog)
![Storefront Fruits Category](assets/screenshots/storefront_fruits_1781803648954.png)

---

### 📊 Admin Portal (Port 3003)
The dashboard displays overall metrics, catalog listings, logistics tasks, vendor reviews, and active coupons.

#### Admin Dashboard
![Admin Dashboard](assets/screenshots/admin_dashboard_1781803663771.png)

#### Catalog Manager
![Admin Catalog Manager](assets/screenshots/admin_catalog_1781803674214.png)

#### Logistics & Orders Tracker
![Admin Logistics Tracker](assets/screenshots/admin_logistics_1781803683976.png)

---

### 🚚 Delivery Partner App (Port 3001)
Used by logistics drivers to accept orders and trace route transitions.

#### Portal Login
![Delivery Partner Portal](assets/screenshots/delivery_login_1781803694246.png)

---

## ⚙️ System Architecture & Services

GroceryHub is built as a set of decoupled microservices and independent frontend portals communicating via REST APIs:

```mermaid
graph TD
    subgraph Client Portals
        FE[Customer Storefront - Port 3000]
        AD[Admin Portal - Port 3003]
        VD[Vendor Hub - Port 3002]
        DP[Delivery Partner - Port 3001]
    end

    subgraph Backend Microservices
        AS[Auth Service - Port 5001]
        PS[Product Service - Port 5002]
        OS[Order Service - Port 5003]
    end

    subgraph Data Tier
        MDB[(MongoDB Database)]
        RDS[(Redis Cache)]
    end

    %% Client communicating with APIs
    FE --> AS & PS & OS
    AD --> AS & PS & OS
    VD --> AS & PS & OS
    DP --> AS & OS

    %% Service to Service
    OS --> PS
    OS --> AS

    %% DB Connections
    AS --> MDB
    PS --> MDB
    PS --> RDS
    OS --> MDB
```

### Port Mapping & Purpose

| Port | Service Name | Tech Stack | Description |
| :--- | :--- | :--- | :--- |
| **27017** | `mongodb` | MongoDB 6.0 | Persistent data storage shared across services. |
| **6379** | `redis` | Redis Alpine | Fast caching layer for catalog requests. |
| **5001** | `auth-service` | Node / Express / Mongoose | Manages user registration, JWT logins, and approvals. |
| **5002** | `product-service`| Node / Express / Redis | Handles catalog query caching and vendor inventories. |
| **5003** | `order-service` | Node / Express / Axios | Validates stock levels, handles checkout, and evaluates coupons. |
| **3000** | `frontend` | React / Vite / Nginx | Portal for customers to browse, cart, and buy items. |
| **3001** | `delivery-partner`| React / Vite / Nginx | Portal for drivers to accept orders and track delivery routes. |
| **3002** | `vendor` | React / Vite / Nginx | Portal for vendors to approve inventory requests. |
| **3003** | `admin` | React / Vite / Nginx | Control panel to manage catalog, vendors, coupons, and orders. |

---

## 🚀 DevOps Implementation & Configuration

All environment variables have been fully internalized into the Docker Compose configurations to enable immediate local orchestration without manually maintaining `.env` files across subdirectories.

### Run Local Development (Build from Source)
To run and build all services dynamically from your local codebase directory:
```bash
docker compose -f src/docker-compose.dev.yml up -d --build
```

### Run Production (Serve Built Registry Images)
To fetch and run pre-built registry images:
```bash
docker compose -f src/docker-compose.yaml up -d
```

### Hardened Docker Security (DevOps Ready)
- **Non-Root Isolation:** The Node backend microservices execute under the `node` user, and the frontend portals execute Nginx under the non-privileged `nginx` user to mitigate runtime exploits.
- **Image Size Minimization:** Double-stage builds are implemented for the frontend to prevent bundle tools from leaking to production.
- **Context Boundaries:** Dedicated `.dockerignore` files are located in all service roots to prevent leaking local development secrets (`.env`) or heavy folders (`node_modules`) into production images.
- **Microservice Healthchecks:** Docker Engine monitors liveness probes using Alpine-native `wget` triggers pointing to individual service `/health` endpoints.

---

## 🛠️ Microservice Life Cycle Synchronization

A background polling hook running on all frontends triggers active order details fetch operations every `3 seconds`. This permits status updates (Placed $\rightarrow$ Validated $\rightarrow$ Prepared $\rightarrow$ Transit $\rightarrow$ Delivered) to sync seamlessly across customer, vendor, admin, and driver portals without requiring full page refreshes.
