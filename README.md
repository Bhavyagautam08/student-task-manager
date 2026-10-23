# Student Task Manager - Module 4 Practical 2

## 🎯 Overview
A **Student Task Management Web Application** built with Node.js & Express.js, containerized using Docker.
Demonstrates REST API CRUD operations and Docker deployment.

## 🚀 Features
- ✅ Create, Read, Update, Delete (CRUD) tasks
- ✅ Filter by status: Pending / In Progress / Completed
- ✅ Filter by priority: High / Medium / Low
- ✅ Search tasks in real-time
- ✅ Sort by priority, due date, or title
- ✅ Grid/List view toggle
- ✅ Persistent storage (JSON file)
- ✅ RESTful API endpoints
- ✅ Dockerized with multi-stage build
- ✅ Health check endpoint

## 📁 Project Structure
```
Practical_2/
├── server.js              # Express.js server + REST API
├── package.json           # Dependencies & scripts
├── Dockerfile             # Docker image definition
├── docker-compose.yml     # Docker Compose config
├── .dockerignore          # Docker build exclusions
├── .gitignore
├── README.md
├── data/
│   └── tasks.json         # Persistent task storage
└── public/
    ├── index.html         # Frontend SPA
    ├── css/
    │   └── app.css        # Styles
    └── js/
        └── app.js         # Frontend JavaScript
```

## 🛠️ REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get all tasks (with query filters) |
| GET | `/api/tasks/:id` | Get single task |
| POST | `/api/tasks` | Create new task |
| PUT | `/api/tasks/:id` | Update full task |
| PATCH | `/api/tasks/:id/status` | Update task status |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/stats` | Get dashboard statistics |
| GET | `/health` | Health check |

## ⚡ Run Locally (Without Docker)
```bash
npm install
npm start
# Open http://localhost:3000
```

## 🐳 Docker Commands
```bash
# Build image
docker build -t taskflow:latest .

# Run container
docker run -d -p 3000:3000 --name taskflow-app taskflow:latest

# Check health
curl http://localhost:3000/health

# View logs
docker logs -f taskflow-app

# Stop container
docker stop taskflow-app && docker rm taskflow-app
```

## 🐳 Docker Compose
```bash
# Start (build + run)
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## 🏥 Health Check
```
GET http://localhost:3000/health
```
Response:
```json
{
  "status": "healthy",
  "service": "Student Task Manager API",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 120.5
}
```

## 👤 Author
**Bhavya** | B.Tech Computer Science
Module 4 - Practical 2: Dockerization and Cloud Deployment
