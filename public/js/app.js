/**
 * app.js - Frontend JavaScript for TaskFlow
 * Module 4 - Practical 2: Dockerization & Cloud Deployment
 * Author: Bhavya
 * 
 * Communicates with Express REST API:
 * GET    /api/tasks       - List all tasks
 * POST   /api/tasks       - Create task
 * PUT    /api/tasks/:id   - Update task
 * PATCH  /api/tasks/:id/status - Update status only
 * DELETE /api/tasks/:id   - Delete task
 * GET    /api/stats       - Get stats
 */

const API = '/api/tasks';

// ===== STATE =====
let state = {
  tasks: [],
  filter: 'all',
  priorityFilter: null,
  search: '',
  sort: 'default',
  viewMode: 'grid',
  editingId: null,
  deleteId: null,
};

// ===== DOM REFS =====
const taskContainer = document.getElementById('taskContainer');
const emptyState = document.getElementById('emptyState');
const taskForm = document.getElementById('taskForm');
const taskModal = new bootstrap.Modal(document.getElementById('taskModal'));
const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
const toast = new bootstrap.Toast(document.getElementById('toast'), { delay: 3000 });

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  await loadStats();
  await loadTasks();
  bindEvents();
});

// ===== API CALLS =====
async function loadTasks() {
  try {
    const res = await fetch(API);
    const json = await res.json();
    if (json.success) {
      state.tasks = json.data;
      renderTasks();
    }
  } catch (e) {
    showToast('Failed to load tasks. Is the server running?', 'danger');
  }
}

async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    const json = await res.json();
    if (json.success) {
      const s = json.data;
      document.getElementById('totalCount').textContent = s.total;
      document.getElementById('pendingCount').textContent = s.pending;
      document.getElementById('inProgressCount').textContent = s.inProgress;
      document.getElementById('completedCount').textContent = s.completed;

      const pct = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
      document.getElementById('progressFill').style.width = `${pct}%`;
      document.getElementById('progressPercent').textContent = `${pct}%`;
    }
  } catch (e) { /* ignore */ }
}

async function createTask(data) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

async function updateTask(id, data) {
  const res = await fetch(`${API}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

async function updateStatus(id, status) {
  const res = await fetch(`${API}/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  return res.json();
}

async function deleteTask(id) {
  const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
  return res.json();
}

// ===== RENDER =====
function renderTasks() {
  let tasks = [...state.tasks];

  // Filter by status
  if (state.filter !== 'all') {
    tasks = tasks.filter(t => t.status === state.filter);
  }

  // Filter by priority
  if (state.priorityFilter) {
    tasks = tasks.filter(t => t.priority === state.priorityFilter);
  }

  // Search
  if (state.search.trim()) {
    const q = state.search.toLowerCase();
    tasks = tasks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  }

  // Sort
  if (state.sort === 'priority') {
    const order = { high: 0, medium: 1, low: 2 };
    tasks.sort((a, b) => order[a.priority] - order[b.priority]);
  } else if (state.sort === 'dueDate') {
    tasks.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  } else if (state.sort === 'title') {
    tasks.sort((a, b) => a.title.localeCompare(b.title));
  }

  if (tasks.length === 0) {
    taskContainer.innerHTML = '';
    taskContainer.className = '';
    emptyState.classList.remove('d-none');
    return;
  }

  emptyState.classList.add('d-none');
  taskContainer.className = state.viewMode === 'grid' ? 'task-grid' : 'task-list';
  taskContainer.innerHTML = tasks.map(task => renderTaskCard(task)).join('');

  // Bind status selects
  taskContainer.querySelectorAll('.status-select').forEach(sel => {
    sel.addEventListener('change', async (e) => {
      const id = e.target.dataset.id;
      const json = await updateStatus(id, e.target.value);
      if (json.success) {
        const idx = state.tasks.findIndex(t => t.id === id);
        if (idx !== -1) state.tasks[idx] = json.data;
        await loadStats();
        renderTasks();
        showToast(`Status updated to "${e.target.value}"`, 'success');
      }
    });
  });
}

function renderTaskCard(task) {
  const priorityIcons = { high: '🔴', medium: '🟡', low: '🟢' };
  const statusLabels = { pending: '⏳ Pending', 'in-progress': '🔄 In Progress', completed: '✅ Completed' };
  const categoryIcons = { academic: '📚', practical: '🔬', study: '📖', project: '🛠️', general: '📌' };

  const dueBadge = task.dueDate
    ? `<span class="badge-due"><i class="bi bi-calendar3"></i> ${formatDate(task.dueDate)}</span>`
    : '';

  const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'
    ? '<span class="badge-due" style="background:rgba(239,68,68,0.15);color:#ef4444;border-color:rgba(239,68,68,0.3)">⚠️ Overdue</span>'
    : '';

  return `
    <div class="task-card priority-${task.priority} ${task.status === 'completed' ? 'opacity-75' : ''}">
      <div class="task-card-header">
        <div>
          <div class="task-title ${task.status === 'completed' ? 'completed-text' : ''}">${escapeHtml(task.title)}</div>
        </div>
        <div class="task-actions">
          <button class="task-btn" title="Edit" onclick="openEditModal('${task.id}')">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="task-btn delete" title="Delete" onclick="confirmDelete('${task.id}')">
            <i class="bi bi-trash3"></i>
          </button>
        </div>
      </div>
      ${task.description ? `<p class="task-desc">${escapeHtml(task.description)}</p>` : ''}
      <div class="task-meta">
        <span class="badge-priority ${task.priority}">${priorityIcons[task.priority]} ${capitalize(task.priority)}</span>
        <span class="badge-category">${categoryIcons[task.category] || '📌'} ${capitalize(task.category)}</span>
        ${dueBadge}
        ${overdue}
      </div>
      <div class="task-footer">
        <select class="status-select" data-id="${task.id}">
          <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>⏳ Pending</option>
          <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>🔄 In Progress</option>
          <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>✅ Completed</option>
        </select>
        <span class="task-date">Created ${timeAgo(task.createdAt)}</span>
      </div>
    </div>
  `;
}

// ===== MODAL HANDLING =====
function openAddModal() {
  state.editingId = null;
  document.getElementById('taskModalLabel').innerHTML = '<i class="bi bi-plus-circle me-2"></i>Add New Task';
  taskForm.reset();
  document.getElementById('taskId').value = '';
  document.getElementById('titleError').style.display = 'none';
}

function openEditModal(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;

  state.editingId = id;
  document.getElementById('taskModalLabel').innerHTML = '<i class="bi bi-pencil me-2"></i>Edit Task';
  document.getElementById('taskId').value = task.id;
  document.getElementById('taskTitle').value = task.title;
  document.getElementById('taskDesc').value = task.description || '';
  document.getElementById('taskPriority').value = task.priority;
  document.getElementById('taskStatus').value = task.status;
  document.getElementById('taskDue').value = task.dueDate || '';
  document.getElementById('taskCategory').value = task.category;
  document.getElementById('titleError').style.display = 'none';

  taskModal.show();
}

function confirmDelete(id) {
  state.deleteId = id;
  deleteModal.show();
}

// ===== SAVE TASK =====
document.getElementById('saveTaskBtn').addEventListener('click', async () => {
  const title = document.getElementById('taskTitle').value.trim();

  if (!title) {
    document.getElementById('titleError').style.display = 'block';
    return;
  }

  document.getElementById('titleError').style.display = 'none';

  const data = {
    title,
    description: document.getElementById('taskDesc').value.trim(),
    priority: document.getElementById('taskPriority').value,
    status: document.getElementById('taskStatus').value,
    dueDate: document.getElementById('taskDue').value,
    category: document.getElementById('taskCategory').value,
  };

  let json;
  if (state.editingId) {
    json = await updateTask(state.editingId, data);
    if (json.success) {
      const idx = state.tasks.findIndex(t => t.id === state.editingId);
      if (idx !== -1) state.tasks[idx] = json.data;
      showToast('Task updated successfully!', 'success');
    }
  } else {
    json = await createTask(data);
    if (json.success) {
      state.tasks.unshift(json.data);
      showToast('Task created successfully!', 'success');
    }
  }

  if (json && json.success) {
    taskModal.hide();
    await loadStats();
    renderTasks();
  } else {
    showToast(json?.message || 'Something went wrong', 'danger');
  }
});

// ===== CONFIRM DELETE =====
document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
  if (!state.deleteId) return;
  const json = await deleteTask(state.deleteId);
  if (json.success) {
    state.tasks = state.tasks.filter(t => t.id !== state.deleteId);
    deleteModal.hide();
    await loadStats();
    renderTasks();
    showToast('Task deleted.', 'success');
  } else {
    showToast('Failed to delete task.', 'danger');
  }
  state.deleteId = null;
});

// ===== BIND EVENTS =====
function bindEvents() {
  // Add task button
  document.getElementById('addTaskBtn').addEventListener('click', openAddModal);
  document.querySelectorAll('[data-bs-target="#taskModal"]').forEach(btn => {
    btn.addEventListener('click', openAddModal);
  });

  // Sidebar filters
  document.querySelectorAll('[data-filter]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      state.filter = e.currentTarget.dataset.filter;
      state.priorityFilter = null;
      document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const titles = {
        all: 'All Tasks', pending: 'Pending Tasks',
        'in-progress': 'In Progress', completed: 'Completed Tasks'
      };
      document.getElementById('pageTitle').textContent = titles[state.filter] || 'Tasks';
      renderTasks();
      if (window.innerWidth < 768) closeSidebar();
    });
  });

  // Priority filters
  document.querySelectorAll('[data-priority-filter]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      state.priorityFilter = e.currentTarget.dataset.priorityFilter;
      state.filter = 'all';
      document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
      e.currentTarget.classList.add('active');
      document.getElementById('pageTitle').textContent = `${capitalize(state.priorityFilter)} Priority`;
      renderTasks();
      if (window.innerWidth < 768) closeSidebar();
    });
  });

  // Search
  document.getElementById('searchInput').addEventListener('input', (e) => {
    state.search = e.target.value;
    renderTasks();
  });

  // Sort tabs
  document.querySelectorAll('.filter-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.sort = btn.dataset.sort;
      renderTasks();
    });
  });

  // View toggle
  document.getElementById('gridView').addEventListener('click', () => {
    state.viewMode = 'grid';
    document.getElementById('gridView').classList.add('active');
    document.getElementById('listView').classList.remove('active');
    renderTasks();
  });

  document.getElementById('listView').addEventListener('click', () => {
    state.viewMode = 'list';
    document.getElementById('listView').classList.add('active');
    document.getElementById('gridView').classList.remove('active');
    renderTasks();
  });

  // Mobile sidebar
  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  document.getElementById('sidebarToggle').addEventListener('click', closeSidebar);
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
}

// ===== UTILITIES =====
function showToast(msg, type = 'success') {
  const toastEl = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  toastMsg.textContent = msg;
  toastEl.className = `toast align-items-center border-0 text-white bg-${type}`;
  toast.show();
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

console.log('%c🚀 TaskFlow - Student Task Manager', 'color: #6366f1; font-weight:bold; font-size:16px;');
console.log('%cModule 4 - Practical 2: Dockerization & Cloud Deployment', 'color: #a855f7');
