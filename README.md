# Urban Nest - Real Estate Platform

A full-stack real estate application with a Spring Boot backend and React frontend.

## Project Structure

```
urban-nest-main/
├── backend/                    # Spring Boot Backend
│   ├── .mvn/                   # Maven wrapper files
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/          # Java source files
│   │   │   └── resources/     # Application configurations
│   │   └── test/              # Test files
│   ├── target/                # Build output
│   ├── mvnw                   # Maven wrapper (Unix)
│   ├── mvnw.cmd               # Maven wrapper (Windows)
│   └── pom.xml                # Maven configuration
│
├── frontend/                   # React Frontend
│   ├── public/                # Static assets
│   │   └── geo/               # GeoJSON files
│   ├── src/
│   │   ├── assets/           # Images and media
│   │   ├── components/       # Reusable React components
│   │   ├── pages/            # Page components
│   │   ├── styles/           # CSS stylesheets
│   │   ├── api.js            # API configuration
│   │   ├── App.jsx           # Main App component
│   │   └── main.jsx          # Application entry point
│   ├── index.html            # HTML template
│   ├── package.json          # NPM dependencies
│   └── vite.config.js        # Vite configuration
│
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites
- Java 17 or higher
- Node.js 18 or higher
- Maven (or use the included wrapper)

### Running the Backend

```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

Or on Windows:
```cmd
cd backend
mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=local
```

The backend will start on `http://localhost:8083`

### Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`

## Features

- User authentication (Login/Signup)
- Property listing and search
- Agent and Buyer roles
- Property posting (for Agents)
- Profile management
- Property details view

## Tech Stack

### Backend
- Spring Boot 3.2.5
- Spring Security
- Spring Data JPA
- MySQL/H2 Database

### Frontend
- React 18
- Vite
- React Router
- Axios

