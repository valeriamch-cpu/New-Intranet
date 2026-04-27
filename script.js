const storageKeys = {
  events: 'intranet-group-events',
  notes: 'intranet-notes-board',
  tasks: 'intranet-tasks',
  expenses: 'intranet-expenses',
  expenseReport: 'intranet-expense-report',
  expenseFolders: 'intranet-expense-folders',
  user: 'intranet-user',
  areas: 'intranet-areas',
  modules: 'intranet-modules',
  auth: 'intranet-auth'
};

const users = {
  valeria: {
    password: '1234',
    areas: ['wholesale', 'marketing', 'finanzas', 'operaciones'],
    modules: ['calendar', 'board', 'expenses', 'tasks']
  },
  veronica: {
    password: '4567',
    areas: ['operaciones'],
    modules: ['calendar', 'board', 'tasks']
  },
  admin: {
    password: 'admin123',
    areas: ['wholesale', 'marketing', 'finanzas', 'operaciones'],
    modules: ['calendar', 'board', 'expenses', 'tasks']
  }
};

// Configura este endpoint (Apps Script / backend) para guardar directamente en Drive.
const DRIVE_UPLOAD_WEBHOOK = '';

const loginForm = document.getElementById('login-form');
if (loginForm) initLogin();

const dashboardRoot = document.getElementById('month-title');
if (dashboardRoot) initDashboard();
const expensesPageRoot = document.getElementById('expenses-page');
if (expensesPageRoot) initExpensesPage();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } catch {
      // no-op
    }
  });
}

function initLogin() {
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginError = document.getElementById('login-error');

  safeRemove(storageKeys.user);
  safeRemove(storageKeys.areas);
  safeRemove(storageKeys.modules);
  safeRemove(storageKeys.auth);

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const user = normalizeUser(usernameInput.value);
    const pass = passwordInput.value.trim();
    const account = users[user];

    if (!account) {
      loginError.textContent = 'Usuario no encontrado.';
      return;
    }

    if (account.password !== pass) {
      loginError.textContent = 'Clave incorrecta.';
      return;
    }

    safeSet(storageKeys.user, user);
    safeSet(storageKeys.areas, JSON.stringify(account.areas));
    safeSet(storageKeys.modules, JSON.stringify(account.modules));
    safeSet(storageKeys.auth, '1');
    window.location.href = 'dashboard.html';
  });
}

function initDashboard() {
  if (!isAuthenticated()) {
    window.location.href = 'index.html';
    return;
  }

  const state = {
    currentDate: new Date(),
    selectedDate: formatDate(new Date()),
    user: safeGet(storageKeys.user) || 'invitado',
    events: loadJson(storageKeys.events, {}),
    tasks: loadJson(storageKeys.tasks, [])
  };

  const sessionUser = document.getElementById('session-user');
  const notesBoard = document.getElementById('notes-board');
  const logoutBtn = document.getElementById('logout-btn');
  const eventForm = document.getElementById('event-form');
  const eventsList = document.getElementById('events-list');
  const eventFeedback = document.getElementById('event-feedback');
  const monthTitle = document.getElementById('month-title');
  const calendarGrid = document.getElementById('calendar-grid');
  const taskForm = document.getElementById('task-form');
  const tasksList = document.getElementById('tasks-list');

  sessionUser.textContent = `Conectado como: ${state.user}`;
  applyAreaPermissions(loadJson(storageKeys.areas, []));
  applyModulePermissions(loadJson(storageKeys.modules, []));

  notesBoard.value = safeGet(storageKeys.notes) || '';
  notesBoard.addEventListener('input', () => safeSet(storageKeys.notes, notesBoard.value));
  document.getElementById('clear-notes').addEventListener('click', () => {
    notesBoard.value = '';
    safeRemove(storageKeys.notes);
  });

  logoutBtn.addEventListener('click', () => {
    safeRemove(storageKeys.user);
    safeRemove(storageKeys.areas);
    safeRemove(storageKeys.modules);
    safeRemove(storageKeys.auth);
  });

  document.getElementById('prev-month').addEventListener('click', () => {
    state.currentDate.setMonth(state.currentDate.getMonth() - 1);
    renderCalendar();
  });

  document.getElementById('next-month').addEventListener('click', () => {
    state.currentDate.setMonth(state.currentDate.getMonth() + 1);
    renderCalendar();
  });

  document.getElementById('today-btn').addEventListener('click', () => {
    const now = new Date();
    state.currentDate = new Date(now.getFullYear(), now.getMonth(), 1);
    state.selectedDate = formatDate(now);
    document.getElementById('event-date').value = state.selectedDate;
    document.getElementById('task-date').value = state.selectedDate;
    renderCalendar();
    renderDayEvents();
  });

  eventForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const date = document.getElementById('event-date').value || state.selectedDate;
    const title = document.getElementById('event-title').value.trim();
    if (!title) return;

    state.events[date] = state.events[date] || [];
    state.events[date].push(title);
    safeSet(storageKeys.events, JSON.stringify(state.events));

    eventForm.reset();
    document.getElementById('event-date').value = date;
    state.selectedDate = date;
    eventFeedback.textContent = `Evento guardado para ${formatHumanDate(date)}.`;
    renderCalendar();
    renderDayEvents();
  });

  taskForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = document.getElementById('task-input').value.trim();
    const dueDate = document.getElementById('task-date').value || state.selectedDate;
    if (!title) return;

    state.tasks.push({ id: String(Date.now()), title, dueDate, done: false });
    safeSet(storageKeys.tasks, JSON.stringify(state.tasks));
    taskForm.reset();
    document.getElementById('task-date').value = state.selectedDate;
    renderTasks();
    renderDayEvents();
  });

  document.getElementById('clear-tasks').addEventListener('click', () => {
    state.tasks = [];
    safeSet(storageKeys.tasks, JSON.stringify(state.tasks));
    renderTasks();
    renderDayEvents();
  });


  function renderCalendar() {
    const base = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth(), 1);
    const monthLabel = base.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    monthTitle.textContent = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

    const firstDay = base.getDay();
    const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    calendarGrid.innerHTML = '';

    for (let i = 0; i < 42; i++) {
      const day = i - firstDay + 1;
      if (day < 1 || day > daysInMonth) {
        const spacer = document.createElement('div');
        spacer.className = 'calendar-empty';
        calendarGrid.appendChild(spacer);
        continue;
      }

      const date = new Date(base.getFullYear(), base.getMonth(), day);
      const dateKey = formatDate(date);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.innerHTML = `<div class="day-number">${day}</div>`;

      if ((state.events[dateKey] || []).length > 0) {
        const marker = document.createElement('span');
        marker.className = 'day-event persona';
        marker.textContent = 'evento';
        btn.appendChild(marker);
      }

      if (dateKey === state.selectedDate) btn.classList.add('selected');
      if (dateKey === formatDate(new Date())) btn.classList.add('today');

      btn.addEventListener('click', () => {
        state.selectedDate = dateKey;
        document.getElementById('event-date').value = dateKey;
        document.getElementById('task-date').value = dateKey;
        renderCalendar();
        renderDayEvents();
      });

      calendarGrid.appendChild(btn);
    }
  }

  function renderDayEvents() {
    eventsList.innerHTML = '';
    const events = state.events[state.selectedDate] || [];
    const dayTasks = state.tasks.filter((task) => task.dueDate === state.selectedDate);

    if (!events.length && !dayTasks.length) {
      const empty = document.createElement('li');
      empty.textContent = `No hay actividades para ${formatHumanDate(state.selectedDate)}.`;
      eventsList.appendChild(empty);
      return;
    }

    events.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = `📅 ${item}`;
      eventsList.appendChild(li);
    });

    dayTasks.forEach((task) => {
      const li = document.createElement('li');
      li.textContent = `🗂️ ${task.title}`;
      eventsList.appendChild(li);
    });
  }

  function renderTasks() {
    tasksList.innerHTML = '';
    if (!state.tasks.length) {
      tasksList.innerHTML = '<li>No hay tareas pendientes.</li>';
      return;
    }

    state.tasks.forEach((task) => {
      const li = document.createElement('li');
      li.className = task.done ? 'done' : '';
      li.innerHTML = `
        <label><input type="checkbox" data-id="${task.id}" ${task.done ? 'checked' : ''}/> ${task.title} <small>(${task.dueDate})</small></label>
        <button type="button" data-remove="${task.id}">Eliminar</button>
      `;
      tasksList.appendChild(li);
    });

    tasksList.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.addEventListener('change', () => {
        const id = cb.getAttribute('data-id');
        const task = state.tasks.find((item) => item.id === id);
        if (!task) return;
        task.done = cb.checked;
        safeSet(storageKeys.tasks, JSON.stringify(state.tasks));
        renderTasks();
      });
    });

    tasksList.querySelectorAll('button[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-remove');
        state.tasks = state.tasks.filter((task) => task.id !== id);
        safeSet(storageKeys.tasks, JSON.stringify(state.tasks));
        renderTasks();
        renderDayEvents();
      });
    });
  }

  document.getElementById('event-date').value = state.selectedDate;
  document.getElementById('task-date').value = state.selectedDate;
  renderCalendar();
  renderDayEvents();
  renderTasks();
}

function initExpensesPage() {
  if (!isAuthenticated()) {
    window.location.href = 'index.html';
    return;
  }
  const modules = loadJson(storageKeys.modules, []);
  if (!modules.includes('expenses')) {
    window.location.href = 'dashboard.html';
    return;
  }

  const user = safeGet(storageKeys.user) || 'invitado';
  const sessionLabel = document.getElementById('expenses-session-user');
  const logoutBtn = document.getElementById('logout-btn');
  const expenseForm = document.getElementById('expense-form');
  const feedback = document.getElementById('expense-feedback');

  sessionLabel.textContent = `Conectado como: ${user}`;
  logoutBtn.addEventListener('click', () => {
    safeRemove(storageKeys.user);
    safeRemove(storageKeys.areas);
    safeRemove(storageKeys.modules);
    safeRemove(storageKeys.auth);
  });

  if (!expenseForm || !feedback) {
    return;
  }

  expenseForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const reportNumber = document.getElementById('report-number').value.trim();
    const name = document.getElementById('report-name').value.trim();
    const detail = document.getElementById('expense-detail').value.trim();
    const amount = Number(document.getElementById('expense-amount').value);
    const photoInput = document.getElementById('expense-photo');
    const photoFile = photoInput.files[0];

    if (!reportNumber || !name || !detail || !amount || !photoFile) {
      feedback.textContent = 'Completa número rendición, nombre, gasto, monto y foto.';
      return;
    }

    const record = {
      reportNumber,
      name,
      detail,
      amount,
      createdAt: new Date().toISOString(),
      photoBase64: await toBase64(photoFile),
      photoName: photoFile.name || 'foto.jpg'
    };

    const saved = await saveExpenseToDrive(record);
    if (saved) {
      expenseForm.reset();
      feedback.textContent = 'Guardado en Drive correctamente.';
      return;
    }

    fallbackLocalSave(record);
    feedback.textContent = 'No se pudo guardar directo en Drive. Se descargó un JSON para subir manualmente.';
  });
}

async function saveExpenseToDrive(record) {
  if (!DRIVE_UPLOAD_WEBHOOK) {
    return false;
  }

  try {
    const response = await fetch(DRIVE_UPLOAD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    return response.ok;
  } catch {
    return false;
  }
}

function fallbackLocalSave(record) {
  const folderName = `${record.reportNumber} - ${record.name}`.trim();
  const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${folderName}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function applyAreaPermissions(allowedAreas) {
  document.querySelectorAll('[data-area]').forEach((link) => {
    const area = link.dataset.area;
    if (allowedAreas.includes(area)) return;
    link.classList.add('disabled');
    link.href = '#';
    link.removeAttribute('target');
  });
}

function applyModulePermissions(allowedModules) {
  document.querySelectorAll('[data-module]').forEach((moduleCard) => {
    const module = moduleCard.dataset.module;
    if (!allowedModules.includes(module)) moduleCard.classList.add('hidden');
  });
}

function isAuthenticated() {
  return safeGet(storageKeys.auth) === '1';
}

function loadJson(key, fallback) {
  const raw = safeGet(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // no-op in restricted environments
  }
}

function safeRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // no-op in restricted environments
  }
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatHumanDate(dateString) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function formatTimestamp(isoDate) {
  return new Date(isoDate).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function normalizeUser(value) {
  const base = String(value || '').trim().toLowerCase();
  return typeof base.normalize === 'function'
    ? base.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    : base;
}

function toBase64(file) {
  if (!file) return Promise.resolve('');
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}
