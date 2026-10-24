# Practical 2: Dockerization & Cloud Deployment of a Node.js Web Application

**Course:** TPDS — Module 4  
**Topic:** Containerization with Docker & Cloud Deployment  
**Candidate Name:** Bhavya | B.Tech Computer Science  
**Repository:** [https://github.com/Bhavyagautam08/student-task-manager](https://github.com/Bhavyagautam08/student-task-manager)  
**Live Cloud Deployment:** [https://student-task-manager.onrender.com](https://student-task-manager.onrender.com)  

---

## 🎯 Practical Objective & Executive Summary

This practical implements a full-stack, production-grade **Student Task Management Web Application (TaskFlow)**, containerizes the entire runtime using **Docker**, and deploys the containerized service to a cloud platform.

The submission demonstrates competency across:
1. **Full-Stack Engineering:** Developing a RESTful API backend using Node.js & Express.js with persistent storage, coupled with an interactive Single Page Application (SPA) frontend.
2. **Production Containerization:** Engineering an optimized, multi-stage `Dockerfile` based on Alpine Linux, implementing security best practices (non-root execution), and automated container healthcheck monitoring.
3. **Container Orchestration:** Implementing a declarative `docker-compose.yml` configuration managing named volume persistence and custom bridge networks.
4. **Cloud Continuous Delivery:** Linking the source repository on GitHub to a cloud container runtime for automated builds, public exposure, and SSL termination.

---

## 🔗 Project Access Links

| Resource | Target Link | Description |
|---|---|---|
| **Source Code Repository** | [github.com/Bhavyagautam08/student-task-manager](https://github.com/Bhavyagautam08/student-task-manager) | Complete Git repository with Dockerfile, Compose, API server & frontend |
| **Live Cloud Application** | [student-task-manager.onrender.com](https://student-task-manager.onrender.com) | Live public containerized service running on cloud infrastructure |
| **Container Health Endpoint** | [student-task-manager.onrender.com/health](https://student-task-manager.onrender.com/health) | Real-time container liveness probe & system uptime metrics |

---

## 🏗️ System & Deployment Architecture

```mermaid
graph TD
    subgraph ClientLayer ["Client Presentation Layer"]
        Browser["Modern Web Browser<br/>(Desktop / Mobile)"]
        SPA["Frontend SPA (public/)<br/>• app.css (Dark Glassmorphism)<br/>• app.js (Async REST Client)"]
        Browser --> SPA
    end

    subgraph ContainerLayer ["Docker Container (node:20-alpine)"]
        Server["Express.js Server (server.js)<br/>Port: 3000"]
        API["REST API Router<br/>/api/tasks & /api/stats"]
        Health["Healthcheck Daemon<br/>GET /health (Every 30s)"]
        Volume["Persistent Storage Mount<br/>/app/data/tasks.json"]
        
        SPA -->|HTTP / JSON| API
        Server --> API
        Server --> Health
        API --> Volume
    end

    subgraph SecurityEnv ["Container Security & Isolation"]
        NonRoot["Non-Root Execution<br/>USER appuser (UID: 1000)"]
        Alpine["Minimal Attack Surface<br/>node:20-alpine Base"]
    end

    subgraph CloudInfra ["Cloud Hosting Platform (Render)"]
        Webhook["GitHub Webhook<br/>(Automated Build Trigger)"]
        CloudDocker["Cloud Container Engine<br/>(Dynamic Port Mapping & SSL)"]
        GH["GitHub Source Repository<br/>Bhavyagautam08/student-task-manager"]
        
        GH --> Webhook
        Webhook --> CloudDocker
        CloudDocker --> ContainerLayer
    end

    ClientLayer -->|HTTPS (Port 443)| CloudDocker
```

---

## 📁 Codebase Structure & Component Responsibilities

```
Practical_2/
├── server.js              # Express.js REST API server, routing & data access layer
├── package.json           # Application dependencies and runtime scripts
├── package-lock.json      # Locked dependency tree for deterministic Docker builds
├── Dockerfile             # Multi-stage production container specification
├── docker-compose.yml     # Multi-container orchestration, volume and network spec
├── .dockerignore          # Build-context optimization (excludes node_modules, logs)
├── .gitignore             # Version control exclusions
├── README.md              # Academic documentation & examiner evaluation report
├── data/
│   └── tasks.json         # JSON persistent storage file (volume mounted in Docker)
└── public/
    ├── index.html         # Single Page Application layout & modal interfaces
    ├── css/
    │   └── app.css        # Responsive styling, design tokens & dark theme
    └── js/
        └── app.js         # Frontend controller, state manager & API client
```

---

## 🔬 Deep-Dive Technical Implementation

### 1. REST API Architecture (`server.js`)
The backend is built with Node.js and Express.js, organized around stateless REST principles:
- **Middleware Pipeline:**
  - `cors()`: Cross-Origin Resource Sharing handling for cloud flexibility.
  - `express.json()` & `express.urlencoded()`: Strict JSON body validation and payload parsing.
  - `express.static()`: Serves high-performance cached frontend static assets directly from `public/`.
- **RESTful Endpoints:**
  - `GET /api/tasks`: Fetches task collection with server-side query filtering by `status`, `priority`, and `category`.
  - `GET /api/tasks/:id`: Fetches a single task entity by UUID with 404 error handling.
  - `POST /api/tasks`: Validates required fields (`title`), assigns a cryptographic UUID v4, and generates an ISO timestamp.
  - `PUT /api/tasks/:id`: Replaces complete task records with validated attributes.
  - `PATCH /api/tasks/:id/status`: Lightweight route for rapid status transitions (`pending`, `in-progress`, `completed`).
  - `DELETE /api/tasks/:id`: Deletes task records and synchronizes with storage.
  - `GET /api/stats`: Dynamic dashboard aggregate metrics (total, pending, completed, overdue, priority breakdown).
  - `GET /health`: Liveness probe for Docker container health monitoring and cloud platform orchestrators.

### 2. Data Persistence Engine (`data/tasks.json`)
- Implements resilient file-system persistence without external database overhead.
- Safe synchronous write operations (`fs.writeFileSync`) write atomic updates to disk whenever a mutating API call is processed.
- Pre-seeds initial sample tasks if no prior database state exists.

### 3. Frontend Single Page Application (`public/`)
- **State Management:** Reactive DOM updates orchestrated by `app.js` using standard Fetch API promises.
- **User Interface:** Features real-time statistics counters, dynamic category filtering, priority color coding, search input filtering, and task editing modal dialogues.

### 4. Docker Containerization Strategy (`Dockerfile`)
The application container is built with an enterprise-grade **multi-stage build**:

```dockerfile
# Stage 1: Build & dependency resolution
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production

# Stage 2: Hardened production runtime
FROM node:20-alpine AS production
ENV NODE_ENV=production PORT=3000
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN mkdir -p /app/data && chown -R appuser:appgroup /app
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health || exit 1
CMD ["node", "server.js"]
```

**Key Engineering Decisions:**
- **Base Image:** `node:20-alpine` reduces image size from ~1GB to under 150MB, minimizing attack surfaces.
- **Layer Caching:** Package files are copied and installed prior to copying source code, ensuring instant re-builds when code changes.
- **Principle of Least Privilege:** Drops root privileges and runs the process under unprivileged user `appuser`.
- **Integrated Healthcheck:** Probes IPv4 loopback (`http://127.0.0.1:3000/health`) every 30 seconds to enable automated container self-healing.

### 5. Multi-Container Orchestration (`docker-compose.yml`)
- Defines service `taskmanager` running container `taskflow-app`.
- Configures port forwarding `3000:3000`.
- Attaches named Docker volume `task_data:/app/data` to ensure zero data loss when containers restart or rebuild.
- Configures isolated bridge network `taskflow-network`.

---

## ☁️ Cloud Deployment Implementation

- **Cloud Platform:** Render Cloud Application Platform (Docker Environment).
- **Deployment Pipeline:** Connected directly to the `main` branch of GitHub repository `Bhavyagautam08/student-task-manager`.
- **Automated Ingestion:** Upon Git push, the cloud platform reads `Dockerfile`, builds the image inside the cloud builder, binds the platform-assigned port (`process.env.PORT`), provisions an SSL certificate, and exposes the public HTTPS web service.

---

## ✅ Evaluation Compliance Matrix

| Requirement # | Prescribed Requirement | Status | Verification & Code Evidence |
|:---:|---|:---:|---|
| **1** | Develop responsive Task Management app | ✅ **Implemented** | Responsive SPA with sidebar, modals, task cards, priority badges (`public/index.html`, `public/css/app.css`, `public/js/app.js`) |
| **2** | Create Node.js server using Express.js | ✅ **Implemented** | Express server initialized with middleware and routing in [`server.js`](server.js) |
| **3** | Implement REST API endpoints for CRUD | ✅ **Implemented** | Full CRUD: `GET`, `POST`, `PUT`, `PATCH`, `DELETE` + `/api/stats` and `/health` |
| **4** | Persistent task data storage | ✅ **Implemented** | File-backed storage in `data/tasks.json` with Docker volume persistence |
| **5** | Create Dockerfile for the application | ✅ **Implemented** | Multi-stage build on `node:20-alpine` with non-root security in [`Dockerfile`](Dockerfile) |
| **6** | Build Docker image via `docker build` | ✅ **Implemented** | Image `taskflow:latest` built successfully using production target |
| **7** | Run app inside Docker container | ✅ **Implemented** | Container `taskflow-app` operational with internal health checks |
| **8** | Test application locally via port mapping | ✅ **Implemented** | Exposed port `3000:3000` verified with both frontend UI and API endpoints |
| **9** | Push source code to GitHub | ✅ **Implemented** | Version controlled and pushed to [`github.com/Bhavyagautam08/student-task-manager`](https://github.com/Bhavyagautam08/student-task-manager) |
| **10** | Deploy Docker container on cloud platform | ✅ **Implemented** | Deployed with live public endpoint at [`student-task-manager.onrender.com`](https://student-task-manager.onrender.com) |

---

## 👤 Developer Information
- **Student Name:** Bhavya
- **Degree:** B.Tech Computer Science & Engineering
- **Module:** TPDS — Module 4 (Practical 2)
- **GitHub Profile:** [@Bhavyagautam08](https://github.com)
