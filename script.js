const storageKeys = {
  events: 'intranet-group-events',
  notes: 'intranet-notes-board',
  chat: 'intranet-group-chat',
  tasks: 'intranet-tasks',
  user: 'intranet-user',
  areas: 'intranet-areas',
  auth: 'intranet-auth'
};

const memoryStore = {};
const users = {
  valeria: { password: '1234', areas: ['wholesale', 'finanzas', 'marketing', 'operaciones'] },
  veronica: { password: '4567', areas: ['operaciones'] },
  admin: { password: 'admin123', areas: ['wholesale', 'finanzas', 'marketing', 'operaciones'] }
};
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('login-error');

if (loginForm && usernameInput && passwordInput && loginError) {
  safeRemove(storageKeys.user);
  safeRemove(storageKeys.areas);
  safeRemove(storageKeys.auth);

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const rawUser = usernameInput.value.trim();
    const user = normalizeUser(rawUser);
    const pass = passwordInput.value.trim();
    const account = users[user];

    if (!user) {
      loginError.textContent = 'Ingresa usuario.';
      return;
    }

    if (!pass) {
      loginError.textContent = 'Ingresa clave.';
      return;
    }

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
    safeSet(storageKeys.auth, '1');
    window.location.href = 'dashboard.html';
  });
}

const monthTitle = document.getElementById('month-title');
const calendarGrid = document.getElementById('calendar-grid');
const eventsList = document.getElementById('events-list');
const eventFeedback = document.getElementById('event-feedback');
const eventForm = document.getElementById('event-form');
const notesBoard = document.getElementById('notes-board');
const clearNotesBtn = document.getElementById('clear-notes');
const chatList = document.getElementById('chat-list');
const chatForm = document.getElementById('chat-form');
const taskForm = document.getElementById('task-form');
const tasksList = document.getElementById('tasks-list');
const clearTasksBtn = document.getElementById('clear-tasks');
const sessionUser = document.getElementById('session-user');
const logoutBtn = document.getElementById('logout-btn');

const isDashboardPage = Boolean(monthTitle && calendarGrid && eventForm);

if (isDashboardPage) {
  safeSet(storageKeys.user, safeGet(storageKeys.user) || 'invitado');
  safeSet(storageKeys.areas, JSON.stringify(['wholesale', 'finanzas', 'marketing', 'operaciones']));
  safeSet(storageKeys.auth, '1');
  initDashboard();
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    safeRemove(storageKeys.user);
    safeRemove(storageKeys.areas);
    safeRemove(storageKeys.auth);
  });
}

function initDashboard() {
  const allowedAreas = loadAreas();
  const state = {
    currentDate: new Date(),
    selectedDate: formatDate(new Date()),
    user: safeGet(storageKeys.user) || 'invitado',
    events: loadEvents(),
    chat: loadChat(),
    tasks: loadTasks()
  };

  sessionUser.textContent = `Conectado como: ${state.user}`;
  applyAreaPermissions(allowedAreas);
  notesBoard.value = safeGet(storageKeys.notes) || '';

  renderCalendar();
  renderDayEvents();
  renderChat();
  renderTasks();

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
    if (taskDateInput) {
      taskDateInput.value = state.selectedDate;
    }
    renderCalendar();
    renderDayEvents();
  });

  eventForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const eventDateInput = document.getElementById('event-date');
    const date = eventDateInput.value || state.selectedDate || formatDate(new Date());
    const title = document.getElementById('event-title').value.trim();

    if (!title) {
      if (eventFeedback) {
        eventFeedback.textContent = 'Escribe un título para el evento.';
      }
      return;
    }

    state.events[date] = state.events[date] || [];
    state.events[date].push(title);
    safeSet(storageKeys.events, JSON.stringify(state.events));

    state.selectedDate = date;
    state.currentDate = new Date(`${date}T00:00:00`);

    eventForm.reset();
    eventDateInput.value = state.selectedDate;
    if (eventFeedback) {
      eventFeedback.textContent = `Evento guardado para ${formatHumanDate(state.selectedDate)}.`;
    }
    renderCalendar();
    renderDayEvents();
  });

  document.getElementById('event-date').value = state.selectedDate;
  const taskDateInput = document.getElementById('task-date');
  if (taskDateInput) {
    taskDateInput.value = state.selectedDate;
  }

  notesBoard.addEventListener('input', () => {
    safeSet(storageKeys.notes, notesBoard.value);
  });

  clearNotesBtn.addEventListener('click', () => {
    notesBoard.value = '';
    safeRemove(storageKeys.notes);
  });

  chatForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const input = document.getElementById('chat-message');
    const text = input.value.trim();

    if (!text) {
      return;
    }

    state.chat.push({
      user: state.user,
      text,
      createdAt: new Date().toISOString()
    });

    if (state.chat.length > 80) {
      state.chat = state.chat.slice(-80);
    }

    safeSet(storageKeys.chat, JSON.stringify(state.chat));
    input.value = '';
    renderChat();
  });

  taskForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = document.getElementById('task-input');
    const taskDate = document.getElementById('task-date');
    const colorInput = document.getElementById('task-color');
    const title = input.value.trim();
    if (!title) {
      return;
    }

    state.tasks.push({
      id: Date.now().toString(),
      title,
      done: false,
      color: colorInput ? colorInput.value : '#10b981',
      dueDate: (taskDate && taskDate.value) || state.selectedDate
    });

    persistTasks(state.tasks);
    input.value = '';
    if (taskDate) {
      taskDate.value = state.selectedDate;
    }
    renderCalendar();
    renderDayEvents();
    renderTasks();
  });

  clearTasksBtn.addEventListener('click', () => {
    state.tasks = [];
    persistTasks(state.tasks);
    renderTasks();
  });

  function renderCalendar() {
    const base = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth(), 1);
    const firstDay = base.getDay();
    const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();

    const monthLabel = base.toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric'
    });
    monthTitle.textContent = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

    calendarGrid.innerHTML = '';
    const totalCells = 42;

    for (let cellIndex = 0; cellIndex < totalCells; cellIndex++) {
      const day = cellIndex - firstDay + 1;
      if (day < 1 || day > daysInMonth) {
        const spacer = document.createElement('div');
        spacer.className = 'calendar-empty';
        calendarGrid.appendChild(spacer);
        continue;
      }

      const date = new Date(base.getFullYear(), base.getMonth(), day);
      const dateKey = formatDate(date);
      const dayBtn = document.createElement('button');
      dayBtn.type = 'button';
      dayBtn.innerHTML = `<div class="day-number">${day}</div>`;

      const events = state.events[dateKey] || [];
      const tasksForDate = state.tasks.filter((task) => task.dueDate === dateKey);
      if (events.length) {
        const markerWrap = document.createElement('div');
        markerWrap.className = 'day-events-inline';
        const marker = document.createElement('span');
        marker.className = 'day-event persona';
        marker.textContent = 'persona';
        markerWrap.appendChild(marker);
        if (events.length > 1) {
          const markerExtra = document.createElement('span');
          markerExtra.className = 'day-event persona';
          markerExtra.textContent = 'persona';
          markerWrap.appendChild(markerExtra);
        }
        if (tasksForDate.length) {
          const taskMarker = document.createElement('span');
          taskMarker.className = 'day-task equipo';
          taskMarker.textContent = 'equipo';
          markerWrap.appendChild(taskMarker);
        }
        dayBtn.appendChild(markerWrap);
      } else if (tasksForDate.length) {
        const markerWrap = document.createElement('div');
        markerWrap.className = 'day-events-inline';
        const taskMarker = document.createElement('span');
        taskMarker.className = 'day-task equipo';
        taskMarker.textContent = 'equipo';
        markerWrap.appendChild(taskMarker);
        dayBtn.appendChild(markerWrap);
      }

      if (dateKey === state.selectedDate) {
        dayBtn.classList.add('selected');
      }

      if (dateKey === formatDate(new Date())) {
        dayBtn.classList.add('today');
      }

      dayBtn.addEventListener('click', () => {
        state.selectedDate = dateKey;
        document.getElementById('event-date').value = dateKey;
        if (taskDateInput) {
          taskDateInput.value = dateKey;
        }
        renderCalendar();
        renderDayEvents();
      });

      calendarGrid.appendChild(dayBtn);
    }
  }

  function renderDayEvents() {
    const events = state.events[state.selectedDate] || [];
    const dayTasks = state.tasks.filter((task) => task.dueDate === state.selectedDate);
    eventsList.innerHTML = '';

    if (!events.length && !dayTasks.length) {
      const empty = document.createElement('li');
      empty.textContent = `No hay eventos para ${formatHumanDate(state.selectedDate)}.`;
      eventsList.appendChild(empty);
      return;
    }

    events.forEach((eventTitle) => {
      const item = document.createElement('li');
      item.textContent = `${formatHumanDate(state.selectedDate)} — ${eventTitle}`;
      eventsList.appendChild(item);
    });

    dayTasks.forEach((task) => {
      const item = document.createElement('li');
      item.textContent = `🗂️ Tarea: ${task.title}${task.done ? ' (completada)' : ''}`;
      eventsList.appendChild(item);
    });
  }

  function renderChat() {
    chatList.innerHTML = '';

    if (!state.chat.length) {
      const empty = document.createElement('li');
      empty.textContent = 'Aún no hay mensajes en el chat grupal.';
      chatList.appendChild(empty);
      return;
    }

    state.chat.forEach((message) => {
      const item = document.createElement('li');
      item.innerHTML = `<strong>${message.user}:</strong> ${message.text}<div class="chat-meta">${formatTimestamp(message.createdAt)}</div>`;
      chatList.appendChild(item);
    });
  }

  function renderTasks() {
    tasksList.innerHTML = '';

    if (!state.tasks.length) {
      const empty = document.createElement('li');
      empty.textContent = 'No hay tareas pendientes.';
      tasksList.appendChild(empty);
      return;
    }

    state.tasks.forEach((task) => {
      const item = document.createElement('li');
      item.className = task.done ? 'done' : '';
      item.style.setProperty('--task-color', task.color || '#10b981');
      item.innerHTML = `
        <label><input type=\"checkbox\" ${task.done ? 'checked' : ''} data-id=\"${task.id}\" /> ${task.title} <small>(${task.dueDate || 'sin fecha'})</small></label>
        <button type=\"button\" data-remove=\"${task.id}\">Eliminar</button>
      `;
      tasksList.appendChild(item);
    });

    tasksList.querySelectorAll('input[type=\"checkbox\"]').forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        const id = checkbox.getAttribute('data-id');
        const task = state.tasks.find((t) => t.id === id);
        if (!task) {
          return;
        }
        task.done = checkbox.checked;
        persistTasks(state.tasks);
        renderTasks();
      });
    });

    tasksList.querySelectorAll('button[data-remove]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.getAttribute('data-remove');
        state.tasks = state.tasks.filter((task) => task.id !== id);
        persistTasks(state.tasks);
        renderTasks();
      });
    });
  }
}

function applyAreaPermissions(allowedAreas) {
  const links = document.querySelectorAll('[data-area]');
  links.forEach((link) => {
    const area = link.dataset.area;
    if (allowedAreas.includes(area)) {
      return;
    }

    link.classList.add('disabled');
    link.removeAttribute('target');
    link.setAttribute('aria-disabled', 'true');
    link.setAttribute('title', 'Sin acceso para tu usuario');
    link.href = '#';
  });
}

function loadAreas() {
  const raw = safeGet(storageKeys.areas);
  const allAreas = ['wholesale', 'finanzas', 'marketing', 'operaciones'];
  if (!raw) {
    return allAreas;
  }
  const parsed = safeJsonParse(raw, allAreas);
  return Array.isArray(parsed) ? parsed : allAreas;
}

function isAuthenticated() {
  return true;
}

function loadEvents() {
  const raw = safeGet(storageKeys.events);
  if (!raw) {
    return {
      '2026-04-20': ['Kickoff semanal del equipo'],
      '2026-04-23': ['Cierre de pendientes del mes']
    };
  }

  const parsed = safeJsonParse(raw, null);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      '2026-04-20': ['Kickoff semanal del equipo'],
      '2026-04-23': ['Cierre de pendientes del mes']
    };
  }

  return parsed;
}

function loadChat() {
  const raw = safeGet(storageKeys.chat);
  if (!raw) {
    return [];
  }

  const parsed = safeJsonParse(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

function loadTasks() {
  const raw = safeGet(storageKeys.tasks);
  if (!raw) {
    return [];
  }
  const parsed = safeJsonParse(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

function persistTasks(tasks) {
  safeSet(storageKeys.tasks, JSON.stringify(tasks));
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

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return memoryStore[key] || null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    memoryStore[key] = value;
  }
}

function safeRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    delete memoryStore[key];
  }
}

function safeJsonParse(rawValue, fallbackValue) {
  try {
    return JSON.parse(rawValue);
  } catch {
    return fallbackValue;
  }
}

function normalizeUser(value) {
  const base = String(value || '')
    .trim()
    .toLowerCase();

  if (typeof base.normalize !== 'function') {
    return base;
  }

  return base.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
