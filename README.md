<div align="center">
  # ✨ Urban Nest
  **Premium Full-Stack Real Estate Ecosystem for the Indian Market**

  [**🌐 Live Demo**](https://urban-nest-nine-omega.vercel.app/)

  [![Java](https://img.shields.io/badge/Java-17+-orange?style=for-the-badge&logo=openjdk)](https://www.oracle.com/java/)
  [![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2.5-brightgreen?style=for-the-badge&logo=springboot)](https://spring.io/projects/spring-boot)
  [![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql)](https://neon.tech/)
</div>

---

## 🏙️ Overview
**Urban Nest** is a sophisticated, high-performance real estate platform designed to harmonize property discovery and professional engagement. Built with enterprise-grade Java security and a high-response React frontend, it empowers users with data-driven tools like **Real-Time Market Heatmaps**, **Secure OTP-Verified Flows**, and **Multi-Role Dashboards**.

---

## 🗺️ Project Architecture

Urban Nest follows a decoupled, service-oriented architecture designed for high scalability and clear separation of concerns.

### 🧱 Backend (Spring Boot 3.2.5)
The backend is organized into standard enterprise tiers to ensure maintainability and testability.

- **`controller/`**: Handles incoming REST requests and directs flow to the service layer.
- **`service/`**: Contains core business logic, validation rules, and transaction boundaries.
- **`entity/`**: JPA/Hibernate models mapping directly to your **PostgreSQL** schema.
- **`repository/`**: Abstraction layer for data access using Spring Data JPA.
- **`dto/`**: Specialized Data Transfer Objects for optimized, secure API responses.
- **`security/`**: Comprehensive security stack including JWT generation, authentication filters, and CORS config.
- **`mapper/`**: Automated mapping logic to convert between database entities and API DTOs.
- **`exception/`**: Global error handling using a centralized `@ControllerAdvice`.

### 🎨 Frontend (React + Vite)
The frontend utilizes a component-driven architecture with a focus on performant rendering and modern DX.

- **`pages/`**: Route-level components (e.g., *Dashboard*, *Profile*, *PropertyDetail*) that compose modular child components.
- **`components/`**: Reusable UI atoms and feature-specific molecules:
  - `layout/`: Shared structures like *Navbar*, *Footer*, and *ProfileDrawer*.
  - `property/`: Specialized cards, grids, and filters for real estate listings.
  - `ui/`: Design-system elements like *StatusBadges*, *Skeletons*, and *Modals*.
- **`services/`**: The communication layer interfacing with the Spring Boot API.
- **`context/`**: Global state management using React Context API:
  - `ThemeContext` — light/dark theme with localStorage persistence (light default)
  - `CompareContext` — property comparison state
  - `SearchContext` — search state
- **`styles/`**: Design token system (`themes.css`) — all CSS variables for both light and dark themes.
- **`utils/`**: Shared logic for currency formatting, date parsing, and visual image processing.

---

## 🛠️ Technical Stack

| Tier | Technologies | Implementation Role |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite | Performance-First UI & Glassmorphism design |
| **Backend** | Spring Boot 3.2, JPA | Enterprise API Core & Persistence |
| **Security** | Spring Security, JWT | Stateless User Protection & Role-Based Access |
| **Database** | PostgreSQL (Neon Tech) | Relational Integrity & Cloud Scaling |
| **Geospatial** | Leaflet, GeoJSON | Intelligent Market Mapping & Heatmaps |

---

## 🏗️ System Flow

```mermaid
graph TD
    A[React Client] <-->|Rest API / JWT| B[Spring Boot Security]
    B <-->|JPA Persistence| C[(PostgreSQL / Neon)]
    B -->|SMTP Transactional| D[Mail Service Gateway]
    A -->|Spatial Overlay| E[Leaflet Heatmap Engine]
```

---

## 🚦 Setup & Installation

### 📋 Prerequisites
- **Java 17+**
- **Node.js 18+**
- **Neon PostgreSQL Instance**

### ⚡ Quick Start

1. **Clone the Repository**
   ```bash
   git clone https://github.com/HC-28/urban-nest.git
   cd urban-nest
   ```

2. **Database Configuration**
   - Create a project on [Neon.tech](https://neon.tech).
   - Gather your connection string, username, and password.
   - Configure these in your `backend/src/main/resources/application.properties` or as environment variables in Render.

3. **Docker One-Command Launch (Recommended — MNC Standard)**
   ```bash
   # Copy sample environment config
   cp .env.docker.example .env

   # Spin up Database, Backend, and Frontend containers
   docker compose up --build -d
   ```
   - **Frontend:** http://localhost:80
   - **Backend API:** http://localhost:8083/api
   - **PostgreSQL:** localhost:5432

4. **Manual Local Launch (Alternative)**
   ```bash
   # Backend Launch
   cd backend
   ./mvnw spring-boot:run

   # Frontend Launch
   cd ../frontend
   npm install
   npm run dev
   ```

---

## 📜 Documentation Reference
All project documentation is organized under the [`docs/`](./docs) directory:
- [🗺️ Full Heatmap Methodology](./docs/HEATMAP.md) — Deep dive into spatial scoring and market analytics.
- [🗄️ Enterprise Database Design](./docs/DATABASE_DESIGN.md) — Production PostgreSQL schema, indexes, and views.
- [🏗️ Frontend Architecture](./docs/FRONTEND_STRUCTURE.md) — Feature-based vertical slice design guide.
- [🧱 Backend Architecture](./docs/BACKEND_STRUCTURE.md) — Domain-Driven Design (DDD) guide.
- [🚀 Migration Guide](./docs/MIGRATION_GUIDE.md) — Production rollout roadmap and checklist.
- [📊 Scoring Formulas](./docs/SCORING_FORMULAS.md) — Real estate mathematical algorithms.
- [🤝 Contributing Guide](./CONTRIBUTING.md) — Branch naming, commits, PR process, code style.
- [📋 Changelog](./CHANGELOG.md) — Release history and migration notes.

---

## 🎨 Theme System

Urban Nest ships with a **light/dark theme toggle** in the Navbar.

| Detail | Value |
|--------|-------|
| **Default** | ☀️ Light |
| **Persistence** | `localStorage` → key `urban-nest-theme` |
| **Architecture** | `data-theme` attr on `<html>` drives all CSS vars |
| **Token file** | `frontend/src/styles/themes.css` |
| **Context** | `frontend/src/context/ThemeContext.jsx` |
| **Toggle** | `frontend/src/components/ui/ThemeToggle.jsx` |

### Extending themes

1. Open `frontend/src/styles/themes.css`
2. Add your token in both `:root` (dark) and `[data-theme="light"]`
3. Use `var(--your-token)` in component CSS — never raw hex

---

<div align="center">
  **Urban Nest: The Future of Real Estate.** 🏙️
</div>
