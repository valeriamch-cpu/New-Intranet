const storageKeys = {
  events: 'intranet-group-events',
  notes: 'intranet-notes-board',
  tasks: 'intranet-tasks',
  expenses: 'intranet-expenses',
  expenseDraft: 'intranet-expense-draft',
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

const loginForm = document.getElementById('login-form');
if (loginForm) initLogin();

const dashboardRoot = document.getElementById('month-title');
if (dashboardRoot) initDashboard();

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
    tasks: loadJson(storageKeys.tasks, []),
    expenses: loadJson(storageKeys.expenses, []),
    expenseDraft: loadJson(storageKeys.expenseDraft, [])
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
  const expenseForm = document.getElementById('expense-form');
  const expensesList = document.getElementById('expenses-list');
  const expenseFeedback = document.getElementById('expense-feedback');
  const saveDraftBtn = document.getElementById('save-expense-draft');
  const finalizeReportBtn = document.getElementById('finalize-expense-report');
  const expenseReportForm = document.getElementById('expense-report-form');

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

  expenseForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = document.getElementById('expense-name').value.trim();
    const amount = Number(document.getElementById('expense-amount').value);
    const detail = document.getElementById('expense-detail').value.trim();
    const photoInput = document.getElementById('expense-photo');

    if (!name || !amount || !detail) {
      expenseFeedback.textContent = 'Completa nombre, monto y detalle.';
      return;
    }

    const photoData = await toBase64(photoInput.files[0]);
    state.expenses.unshift({
      id: String(Date.now()),
      name,
      amount,
      detail,
      photoData,
      createdAt: new Date().toISOString()
    });

    safeSet(storageKeys.expenses, JSON.stringify(state.expenses));
    state.expenseDraft = [...state.expenses];
    safeSet(storageKeys.expenseDraft, JSON.stringify(state.expenseDraft));
    expenseForm.reset();
    expenseFeedback.textContent = 'Gasto agregado al borrador de rendición.';
    renderExpenses();
  });

  saveDraftBtn.addEventListener('click', () => {
    if (!state.expenses.length) {
      expenseFeedback.textContent = 'No hay gastos para guardar en borrador.';
      return;
    }
    state.expenseDraft = [...state.expenses];
    safeSet(storageKeys.expenseDraft, JSON.stringify(state.expenseDraft));
    expenseFeedback.textContent = `Borrador guardado con ${state.expenseDraft.length} gasto(s).`;
  });

  finalizeReportBtn.addEventListener('click', () => {
    expenseReportForm.classList.remove('hidden');
    document.getElementById('report-number').focus();
  });

  expenseReportForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const reportNumber = document.getElementById('report-number').value.trim();
    const reportOwner = document.getElementById('report-owner').value.trim();
    const expensesToExport = state.expenseDraft.length ? state.expenseDraft : state.expenses;

    if (!reportNumber || !reportOwner) {
      expenseFeedback.textContent = 'Completa número y nombre para la rendición.';
      return;
    }

    if (!expensesToExport.length) {
      expenseFeedback.textContent = 'No hay gastos en borrador para finalizar.';
      return;
    }

    const folderName = `${reportNumber} - ${reportOwner}`;
    downloadExpenseReport(folderName, expensesToExport);
    expenseFeedback.textContent = `Rendición lista. En Drive crea la carpeta "${folderName}" y sube el archivo descargado + fotos.`;
    expenseReportForm.reset();
    expenseReportForm.classList.add('hidden');
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

  function renderExpenses() {
    expensesList.innerHTML = '';
    if (!state.expenses.length) {
      expensesList.innerHTML = '<li>Aún no hay gastos registrados.</li>';
      return;
    }

    state.expenses.forEach((expense) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${expense.name}</strong> · $${expense.amount.toFixed(2)}<br/>
        <small>${expense.detail} · ${formatTimestamp(expense.createdAt)}</small>
        ${expense.photoData ? `<img src="${expense.photoData}" alt="Comprobante de ${expense.name}" />` : ''}
      `;
      expensesList.appendChild(li);
    });
  }

  document.getElementById('event-date').value = state.selectedDate;
  document.getElementById('task-date').value = state.selectedDate;
  renderCalendar();
  renderDayEvents();
  renderTasks();
  renderExpenses();
}

function downloadExpenseReport(folderName, expenses) {
  const payload = {
    folderName,
    generatedAt: new Date().toISOString(),
    expenses
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = folderName.replace(/[^\w\- ]+/g, '').trim() || 'rendicion';
  link.href = url;
  link.download = `${safeName}.json`;
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
