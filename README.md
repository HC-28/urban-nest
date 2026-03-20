<div align="center">
  <img src="./frontend/src/assets/banner.png" alt="Urban Nest Banner" width="100%"/>

  # ✨ Urban Nest
  **Premium Full-Stack Real Estate Ecosystem for the Indian Market**

  [![Java](https://img.shields.io/badge/Java-17+-orange?style=for-the-badge&logo=openjdk)](https://www.oracle.com/java/)
  [![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2.5-brightgreen?style=for-the-badge&logo=springboot)](https://spring.io/projects/spring-boot)
  [![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
</div>

---

## 🏙️ Overview
**Urban Nest** is a sophisticated, high-performance real estate platform designed to harmonize property discovery and professional engagement. Built with enterprise-grade Java security and a high-response React frontend, it empowers users with data-driven tools like **Real-Time Market Heatmaps**, **Secure OTP-Verified Flows**, and **Multi-Role Dashboards**.

---

## 🚀 Enterprise Features

### 🔐 Secure & Verified Auth
- **Double-Factor OTP Mechanism:** State-driven verification for signups and password recovery.
- **Dynamic Role Management:** Intelligent routing for Buyers, Agents, and Platform Administrators.
- **JWT Stateless Security:** Short-lived access tokens with robust backend interceptors.

### 🗺️ Predictive Discovery Engine
- **Geospatial Heatmaps:** Instant visualization of Inventory, Price Trends, and Liquidity (Mumbai, Bangalore, Ahmedabad).
- **Custom Normalization Logic:**
  - $$Score_{price} = \ln(P_{median}) \text{ Model}$$
  - $$Score_{demand} = percentile(Views, Favs, Inquiries)$$
- **Granular Search Stack:** Multi-dimensional filtering across status, budget, and amenities.

### 👔 Elite Agent Workspace
- **Engagement Funnels:** Deep analytics on property performance and user interest.
- **Approval Lifecycle:** Formal documentation and identity verification for agent onboarding.
- **Direct Messaging:** Seamless built-in communication bridge.

---

## 🛠️ Technical Stack

| Tier | Technologies | Role |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, Vanilla CSS | Performance-First UI & Glassmorphism design |
| **Backend** | Spring Boot 3.2.5, JPA, Hibernate | Enterprise API Core |
| **Security** | Spring Security, JWT, OTP | Multi-layered user protection |
| **Geospatial** | Leaflet, GeoJSON | Intelligent market mapping |
| **Database** | PostgreSQL | Relational data integrity |

---

## 🏗️ System Architecture

```mermaid
graph TD
    A[React Client] <-->|Rest API / JWT| B[Spring Boot Security]
    B <-->|JPA Persistence| C[(PostgreSQL)]
    B -->|SMTP Transactional| D[Mail Service Gateway]
    A -->|Spatial Overlay| E[Leaflet Heatmap Engine]
```

---

## 🚦 Getting Started

### 📋 Prerequisites
- **Java 17+** | **Node.js 18+** | **PostgreSQL 14+**

### ⚡ Quick Launch

1. **Environment Setup**
    ```bash
    git clone https://github.com/HC-28/urban-nest.git
    cd urban-nest
    ```

2. **Backend Gateway**
    ```bash
    cd backend
    ./mvnw spring-boot:run
    ```

3. **Frontend Experience**
    ```bash
    cd frontend
    npm install && npm run dev
    ```

---

## 📜 Documentation Reference
- [Full Heatmap Methodology](./HEATMAP.md)
- [API Specification](./backend/src/main/resources/api-docs.md)

---
<div align="center">
  **Urban Nest: The Future of Real Estate.** 🏙️
</div>
