const intranetContent = {
  meetingSummary: [
    'Reunión Salomon: Popi encargada de enviar propuesta.',
    'Juan y Jano revisar plan para lanzamiento Carhartt.',
    'Inventario Montduck listo en Lo Echevers.',
    'Black Friday Marais: carga full con RDMTPN, Cachagua y Burritos.',
    'Margarita: revisar arte y gráficas para Black Marais.',
    'Hey Dude Marais: instalación mañana en la noche.',
    'Hey Dude en The Market: cerrar gráficas y neones ASAP.',
    'Poleras: continuar producción tras mantención de Microgeo.',
    'Agendar ruteros Paris y Falabella con prioridad fin de año.'
  ],
  pendingTopics: [
    'Confirmar piezas gráficas de campaña semanal.',
    'Actualizar status de quiebres de stock por tienda.',
    'Publicar minutas de comité de seguimiento.'
  ],
  importDates: ['Viernes 28 - Operación full day.', 'Martes 2 - Cierre de órdenes mayoristas.', 'Jueves 11 - Ventana de recepción en bodega.']
};

const teams = {
  general: {
    name: 'Calendario principal',
    subtitle: 'Eventos importantes de toda la empresa',
    events: {
      '2026-04-20': ['Townhall mensual'],
      '2026-04-23': ['Cierre de reporte trimestral'],
      '2026-05-03': ['Lanzamiento de campaña Q2']
    }
  },
  equipos: {
    name: 'Equipo de Operaciones',
    subtitle: 'Seguimiento operativo y coordinación interna',
    events: {
      '2026-04-18': ['Revisión de SLAs'],
      '2026-04-28': ['Capacitación de procesos']
    }
  },
  finanzas: {
    name: 'Finanzas',
    subtitle: 'Pagos, presupuestos y cierres contables',
    events: {
      '2026-04-25': ['Aprobación de presupuesto'],
      '2026-05-01': ['Cierre contable mensual']
    }
  },
  wholesale: {
    name: 'Wholesale',
    subtitle: 'Gestión de cuentas mayoristas y pipeline',
    events: {
      '2026-04-21': ['Revisión de cuentas clave'],
      '2026-05-06': ['Demo nuevo catálogo']
    }
  },
  marketing: {
    name: 'Marketing',
    subtitle: 'Campañas, contenido y adquisición',
    events: {
      '2026-04-19': ['Plan de contenidos'],
      '2026-04-29': ['Presentación resultados de campaña']
    }
  },
  gestion: {
    name: 'Gestión',
    subtitle: 'Dirección, decisiones y seguimiento estratégico',
    events: {
      '2026-04-22': ['Comité ejecutivo'],
      '2026-05-04': ['KPIs de negocio']
    }
  }
};

const state = {
  teamKey: 'general',
  currentDate: new Date(),
  selectedDate: formatDate(new Date())
};

const meetingPoints = document.getElementById('meeting-points');
const pendingList = document.getElementById('pending-list');
const importsList = document.getElementById('imports-list');

const teamNav = document.getElementById('team-nav');
const monthTitle = document.getElementById('month-title');
const calendarGrid = document.getElementById('calendar-grid');
const currentTeamName = document.getElementById('current-team-name');
const calendarSubtitle = document.getElementById('calendar-subtitle');
const eventsList = document.getElementById('events-list');
const eventForm = document.getElementById('event-form');

init();

function init() {
  renderInternalInfo();
  renderTeamButtons();
  renderCalendar();
  renderDayEvents();

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

    const team = teams[state.teamKey];
    team.events[date] = team.events[date] || [];
    team.events[date].push(title);

    state.selectedDate = date;
    state.currentDate = new Date(`${date}T00:00:00`);

    eventForm.reset();
    renderCalendar();
    renderDayEvents();
  });
}

function renderInternalInfo() {
  intranetContent.meetingSummary.forEach((point) => {
    const item = document.createElement('li');
    item.textContent = point;
    meetingPoints.appendChild(item);
  });

  intranetContent.pendingTopics.forEach((topic) => {
    const item = document.createElement('li');
    item.textContent = topic;
    pendingList.appendChild(item);
  });

  intranetContent.importDates.forEach((date) => {
    const item = document.createElement('li');
    item.textContent = date;
    importsList.appendChild(item);
  });
}

function renderTeamButtons() {
  teamNav.innerHTML = '';

  Object.entries(teams).forEach(([key, team]) => {
    const button = document.createElement('button');
    button.textContent = team.name;
    button.className = key === state.teamKey ? 'active' : '';

    button.addEventListener('click', () => {
      state.teamKey = key;
      currentTeamName.textContent = team.name;
      calendarSubtitle.textContent = team.subtitle;
      renderTeamButtons();
      renderCalendar();
      renderDayEvents();
    });

    teamNav.appendChild(button);
  });
}

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

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(base.getFullYear(), base.getMonth(), day);
    const dateKey = formatDate(date);
    const dayBtn = document.createElement('button');
    dayBtn.type = 'button';
    dayBtn.innerHTML = `<div class="day-number">${day}</div>`;

    const events = teams[state.teamKey].events[dateKey] || [];
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

  currentTeamName.textContent = teams[state.teamKey].name;
  calendarSubtitle.textContent = teams[state.teamKey].subtitle;
}

function renderDayEvents() {
  const events = teams[state.teamKey].events[state.selectedDate] || [];
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
