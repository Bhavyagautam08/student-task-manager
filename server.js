/**
 * server.js - Student Task Management App
 * Module 4 - Practical 2: Dockerization and Cloud Deployment
 * Author: Bhavya
 */

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ===== IN-MEMORY STORAGE (Persistent-like with JSON file) =====
const fs = require('fs');
const DATA_FILE = path.join(__dirname, 'data', 'tasks.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// Load or initialize tasks
let tasks = [];
if (fs.existsSync(DATA_FILE)) {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    tasks = JSON.parse(raw);
  } catch (e) {
    tasks = [];
  }
}

// Save tasks to file (persistence)
function saveTasks() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
}

// Seed some initial tasks if empty
if (tasks.length === 0) {
  tasks = [
    {
      id: uuidv4(),
      title: 'Complete Module 4 Assignment',
      description: 'Build portfolio website and dockerize Node.js app',
      priority: 'high',
      status: 'in-progress',
      dueDate: '2024-12-31',
      category: 'academic',
      createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      title: 'Review Git & GitHub Concepts',
      description: 'Study branching, merging, pull requests',
      priority: 'medium',
      status: 'completed',
      dueDate: '2024-12-15',
      category: 'study',
      createdAt: new Date().toISOString()
    },
    {
      id: uuidv4(),
      title: 'Set Up Docker Desktop',
      description: 'Install Docker and test hello-world container',
      priority: 'high',
      status: 'completed',
      dueDate: '2024-12-10',
      category: 'practical',
      createdAt: new Date().toISOString()
    }
  ];
  saveTasks();
}

// ===== REST API ROUTES =====

// GET /api/tasks - Get all tasks
app.get('/api/tasks', (req, res) => {
  const { status, priority, category } = req.query;
  let filtered = [...tasks];

  if (status) filtered = filtered.filter(t => t.status === status);
  if (priority) filtered = filtered.filter(t => t.priority === priority);
  if (category) filtered = filtered.filter(t => t.category === category);

  // Sort: pending > in-progress > completed, then by createdAt desc
  const statusOrder = { 'pending': 0, 'in-progress': 1, 'completed': 2 };
  filtered.sort((a, b) => {
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  res.json({
    success: true,
    count: filtered.length,
    data: filtered
  });
});

// GET /api/tasks/:id - Get single task
app.get('/api/tasks/:id', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }
  res.json({ success: true, data: task });
});

// POST /api/tasks - Create new task
app.post('/api/tasks', (req, res) => {
  const { title, description, priority, dueDate, category } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ success: false, message: 'Task title is required' });
  }

  const newTask = {
    id: uuidv4(),
    title: title.trim(),
    description: description ? description.trim() : '',
    priority: priority || 'medium',
    status: 'pending',
    dueDate: dueDate || '',
    category: category || 'general',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  tasks.unshift(newTask);
  saveTasks();

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: newTask
  });
});

// PUT /api/tasks/:id - Update task (full update)
app.put('/api/tasks/:id', (req, res) => {
  const idx = tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  const { title, description, priority, status, dueDate, category } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ success: false, message: 'Task title is required' });
  }

  tasks[idx] = {
    ...tasks[idx],
    title: title.trim(),
    description: description ? description.trim() : '',
    priority: priority || tasks[idx].priority,
    status: status || tasks[idx].status,
    dueDate: dueDate !== undefined ? dueDate : tasks[idx].dueDate,
    category: category || tasks[idx].category,
    updatedAt: new Date().toISOString()
  };

  saveTasks();
  res.json({ success: true, message: 'Task updated successfully', data: tasks[idx] });
});

// PATCH /api/tasks/:id/status - Update task status only
app.patch('/api/tasks/:id/status', (req, res) => {
  const idx = tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  const { status } = req.body;
  const validStatuses = ['pending', 'in-progress', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status. Must be: pending, in-progress, or completed' });
  }

  tasks[idx].status = status;
  tasks[idx].updatedAt = new Date().toISOString();
  saveTasks();

  res.json({ success: true, message: 'Status updated', data: tasks[idx] });
});

// DELETE /api/tasks/:id - Delete task
app.delete('/api/tasks/:id', (req, res) => {
  const idx = tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  const deleted = tasks.splice(idx, 1)[0];
  saveTasks();

  res.json({ success: true, message: 'Task deleted successfully', data: deleted });
});

// GET /api/stats - Dashboard statistics
app.get('/api/stats', (req, res) => {
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    high: tasks.filter(t => t.priority === 'high').length,
    medium: tasks.filter(t => t.priority === 'medium').length,
    low: tasks.filter(t => t.priority === 'low').length,
  };
  res.json({ success: true, data: stats });
});

// ===== HEALTH CHECK ENDPOINT =====
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Student Task Manager API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ===== SERVE FRONTEND =====
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===== START SERVER =====
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Student Task Manager is running!`);
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`📋 API Base: http://localhost:${PORT}/api/tasks`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
  console.log(`\nModule 4 - Practical 2: Dockerization & Cloud Deployment\n`);
});

module.exports = app;
