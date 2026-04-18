const storageKeys = {
  events: 'intranet-group-events',
  notes: 'intranet-notes-board',
  chat: 'intranet-group-chat',
  user: 'intranet-user',
  areas: 'intranet-areas',
  auth: 'intranet-auth'
};

const memoryStore = {};
const users = {
  valeria: { password: '1234', areas: ['wholesale', 'finanzas', 'marketing', 'operaciones'] },
  veronica: { password: '4567', areas: ['operaciones'] },
  admin: { password: '2026', areas: ['wholesale', 'finanzas', 'marketing', 'operaciones'] }
};
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const loginError = document.getElementById('login-error');

if (loginForm && usernameInput && loginError) {
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const rawUser = usernameInput.value.trim();
    const user = normalizeUser(rawUser) || 'invitado';
    const account = users[user];
    const sessionAreas = account ? account.areas : ['wholesale', 'finanzas', 'marketing', 'operaciones'];

    safeSet(storageKeys.user, user);
    safeSet(storageKeys.areas, JSON.stringify(sessionAreas));
    safeSet(storageKeys.auth, '1');
    window.location.href = 'dashboard.html';
  });
}

const monthTitle = document.getElementById('month-title');
const calendarGrid = document.getElementById('calendar-grid');
const eventsList = document.getElementById('events-list');
const eventForm = document.getElementById('event-form');
const notesBoard = document.getElementById('notes-board');
const clearNotesBtn = document.getElementById('clear-notes');
const chatList = document.getElementById('chat-list');
const chatForm = document.getElementById('chat-form');
const sessionUser = document.getElementById('session-user');
const logoutBtn = document.getElementById('logout-btn');

const isDashboardPage = Boolean(monthTitle && calendarGrid && eventForm);
const isLoginPage = Boolean(loginForm && !isDashboardPage);

if (isLoginPage) {
  safeSet(storageKeys.user, 'invitado');
  safeSet(storageKeys.areas, JSON.stringify(['wholesale', 'finanzas', 'marketing', 'operaciones']));
  safeSet(storageKeys.auth, '1');
  window.location.replace('dashboard.html');
}

if (isDashboardPage) {
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
    chat: loadChat()
  };

  sessionUser.textContent = `Conectado como: ${state.user}`;
  applyAreaPermissions(allowedAreas);
  notesBoard.value = safeGet(storageKeys.notes) || '';

  renderCalendar();
  renderDayEvents();
  renderChat();

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
    renderCalendar();
    renderDayEvents();
  });

  eventForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const date = document.getElementById('event-date').value;
    const title = document.getElementById('event-title').value.trim();

    if (!date || !title) {
      return;
    }

    state.events[date] = state.events[date] || [];
    state.events[date].push(title);
    safeSet(storageKeys.events, JSON.stringify(state.events));

    state.selectedDate = date;
    state.currentDate = new Date(`${date}T00:00:00`);

    eventForm.reset();
    renderCalendar();
    renderDayEvents();
  });

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

  function renderCalendar() {
    const base = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth(), 1);
    const firstDay = (base.getDay() + 6) % 7;
    const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();

    monthTitle.textContent = base.toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric'
    });

    calendarGrid.innerHTML = '';

    for (let i = 0; i < firstDay; i++) {
      const spacer = document.createElement('div');
      calendarGrid.appendChild(spacer);
    }
  }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(base.getFullYear(), base.getMonth(), day);
      const dateKey = formatDate(date);
      const dayBtn = document.createElement('button');
      dayBtn.type = 'button';
      dayBtn.innerHTML = `<div class="day-number">${day}</div>`;

      const events = state.events[dateKey] || [];
      if (events.length) {
        const marker = document.createElement('div');
        marker.className = 'day-event';
        marker.textContent = `${events.length} evento(s)`;
        dayBtn.appendChild(marker);
      }

      if (dateKey === state.selectedDate) {
        dayBtn.classList.add('selected');
      }

      if (dateKey === formatDate(new Date())) {
        dayBtn.classList.add('today');
      }

      dayBtn.addEventListener('click', () => {
        state.selectedDate = dateKey;
        renderCalendar();
        renderDayEvents();
      });

      calendarGrid.appendChild(dayBtn);
    }
  }

  function renderDayEvents() {
    const events = state.events[state.selectedDate] || [];
    eventsList.innerHTML = '';

    if (!events.length) {
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
  if (!raw) {
    return ['wholesale'];
  }
  const parsed = safeJsonParse(raw, ['wholesale']);
  return Array.isArray(parsed) ? parsed : ['wholesale'];
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

function formatDate(date) {
  return date.toISOString().slice(0, 10);
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
