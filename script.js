// ────────────────────────────────────────────────────────────
// StudyNest — Live Engine (V5 - Dango Edition)
// ────────────────────────────────────────────────────────────

// Bumped to v5 to force clear old Mochi data
const StorageService = {
  key: 'studynest_v5',
  load: () => {
    try {
      const saved = localStorage.getItem(StorageService.key);
      return saved ? JSON.parse(saved) : null;
    } catch(e) { return null; }
  },
  save: (data) => {
    localStorage.setItem(StorageService.key, JSON.stringify(data));
  },
  clear: () => {
    localStorage.removeItem(StorageService.key);
  }
};

const defaultState = {
  tasks: [],
  deadlines: [],
  events: [],
  habits: [],
  stats: { sessions: 0, minutes: 0 },
  prefs: { audioOn: false, streak: 0, currentTrack: 'rain' },
  user: { name: 'Dango', status: 'Deep Work Mode', avatar: '🍡' }
};

let state = StorageService.load() || JSON.parse(JSON.stringify(defaultState));

if (!state.user) state.user = { name: 'Dango', status: 'Deep Work Mode', avatar: '🍡' };

function save() { StorageService.save(state); }
const $ = id => document.getElementById(id);

// ── DATE UTILS (Local Time) ──
function getLocalDateString(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// ── NAVIGATION ──
document.querySelectorAll('.sb-item').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.sb-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    e.currentTarget.classList.add('active');
    $(e.currentTarget.dataset.view + 'View').classList.add('active');
    if (window.innerWidth <= 768) $('sidebar').classList.remove('open');
  });
});
$('mobileMenuBtn').addEventListener('click', () => $('sidebar').classList.toggle('open'));

// ── MODAL UTILS ──
window.openModal = (id) => {
  if (id === 'dlModal') $('dlDateInp').valueAsDate = new Date();
  if (id === 'evModal') $('evDateInp').valueAsDate = new Date();
  if (id === 'audioModal') renderAudioGrid();
  if (id === 'profileModal') openProfileModal();
  $(id).classList.add('open');
};
window.closeModal = (id) => $(id).classList.remove('open');

// ── PROFILE & AVATAR LOGIC ──
const AVATARS = ['🍡', '🐱', '🦊', '🐼', '👧', '🧙‍♂️', '👾', '🐶', '🐸', '🌸'];

window.openProfileModal = () => {
  $('profileNameInp').value = state.user.name;
  $('profileStatusInp').value = state.user.status;

  $('avatarPicker').innerHTML = AVATARS.map(emoji => `
    <div class="avatar-option ${state.user.avatar === emoji ? 'selected' : ''}"
         onclick="selectAvatar('${emoji}')">
      ${emoji}
    </div>
  `).join('');

  openModal('profileModal');
};

window.selectAvatar = (emoji) => {
  state.user.avatar = emoji;
  document.querySelectorAll('.avatar-option').forEach(el => {
    el.classList.toggle('selected', el.textContent.trim() === emoji);
  });
};

window.saveProfile = () => {
  state.user.name = $('profileNameInp').value.trim() || 'User';
  state.user.status = $('profileStatusInp').value;

  save();
  updateProfileUI();
  closeModal('profileModal');
  showNotif('Profile updated!');
};

function updateProfileUI() {
  $('userAvatar').textContent = state.user.avatar;
  $('userName').textContent = state.user.name;
  $('userStatus').textContent = state.user.status;
}

window.resetAppData = () => {
  if (confirm("Are you sure? This will delete all your tasks, habits, and stats permanently.")) {
    StorageService.clear();
    location.reload();
  }
};

// ── EXPORT DATA (Backup) ──
window.exportData = () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "studynest_backup.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
  showNotif('Backup downloaded!');
};

// ── TIMER ──
let timerInterval;
let timerState = { total: 1500, left: 1500, running: false, mode: 'pomodoro', cycle: 1 };

function updateTimerUI() {
  const m = Math.floor(timerState.left / 60);
  const s = timerState.left % 60;
  $('timerDigits').textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  const offset = 289 - (timerState.left / timerState.total) * 289;
  $('timerProgress').style.strokeDashoffset = offset;
}

window.toggleTimer = () => {
  if (timerState.running) {
    clearInterval(timerInterval);
    $('startBtn').textContent = 'Resume';
  } else {
    $('startBtn').textContent = 'Pause';
    timerInterval = setInterval(() => {
      timerState.left--;
      if (timerState.left <= 0) {
        clearInterval(timerInterval);
        timerState.running = false;
        $('startBtn').textContent = 'Start Session';
        timerState.left = timerState.total;

        if (timerState.mode === 'pomodoro') {
          state.stats.sessions++;
          state.stats.minutes += timerState.total / 60;
          timerState.cycle = timerState.cycle === 4 ? 1 : timerState.cycle + 1;
          $('timerCycle').textContent = timerState.cycle;
          renderStats(); save(); playChime(); showNotif('Session Complete! ☕');
        }
      }
      updateTimerUI();
    }, 1000);
  }
  timerState.running = !timerState.running;
};

window.resetTimer = () => {
  clearInterval(timerInterval); timerState.running = false;
  timerState.left = timerState.total; $('startBtn').textContent = 'Start Session';
  updateTimerUI();
};

window.skipTimer = () => {
  clearInterval(timerInterval); timerState.running = false;
  timerState.left = timerState.total; $('startBtn').textContent = 'Start Session';
  updateTimerUI();
};

window.setTimerMode = (mins) => {
  clearInterval(timerInterval); timerState.running = false;
  timerState.total = mins * 60; timerState.left = timerState.total;
  $('startBtn').textContent = 'Start Session';
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  updateTimerUI();
};

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.5, ctx.currentTime + (i * 0.1));
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (i * 0.1) + 1.5);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(ctx.currentTime + (i * 0.1)); osc.stop(ctx.currentTime + (i * 0.1) + 1.5);
    });
  } catch(e) {}
}

// ── RENDER DATA & CHARTS ──
function renderStats() {
  $('statSessions').textContent = state.stats.sessions;
  $('statHrs').textContent = Math.floor(state.stats.minutes / 60);
  $('statMins').textContent = state.stats.minutes % 60;

  // Fixed Math: If total is 0, pct is 0.
  const done = state.tasks.filter(t => t.done).length;
  const total = state.tasks.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  $('statTaskPct').textContent = pct;
  $('statPctText').textContent = pct + '%';
  $('statProgressBar').style.width = pct + '%';

  $('hTotalH').textContent = Math.floor(state.stats.minutes / 60);
  $('hTotalM').textContent = state.stats.minutes % 60;
  $('hRate').textContent = pct;
  $('hStreak').textContent = state.prefs.streak;
  $('streakCount').textContent = state.prefs.streak;

  renderCharts();
}

function renderTasks() {
  const list = $('taskList');
  const activeTasks = state.tasks.filter(t => !t.done);

  if (activeTasks.length === 0) {
    list.innerHTML = `<div class="empty-state">Queue clear.<br>Great job!</div>`;
  } else {
    list.innerHTML = activeTasks.map(t => `
      <li class="task-item" id="task-${t.id}">
        <button class="task-check ${t.done ? 'done' : ''}" onclick="toggleTask(${t.id})"></button>
        <div>
          <div class="task-text">${escHtml(t.text)}</div>
          <div class="task-tag">${escHtml(t.tag)}</div>
        </div>
      </li>
    `).join('');
  }

  $('taskCountDone').textContent = state.tasks.filter(t => t.done).length;
  $('taskCountTotal').textContent = state.tasks.length;
  renderStats();
}

window.toggleTask = (id) => {
  const t = state.tasks.find(x => x.id === id);
  t.done = !t.done;

  if (t.done) {
    const el = $(`task-${id}`);
    if(el) {
      el.querySelector('.task-check').classList.add('done');
      el.querySelector('.task-text').style.textDecoration = 'line-through';
      el.querySelector('.task-text').style.opacity = '0.5';

      setTimeout(() => {
        save();
        renderTasks();
      }, 600);
      return;
    }
  }
  save(); renderTasks();
};

function renderDeadlines() {
  const list = $('deadlineList');
  if (state.deadlines.length === 0) {
    list.innerHTML = `<div class="empty-state">No urgent milestones.</div>`;
  } else {
    list.innerHTML = state.deadlines.map(d => `
      <div class="dl-item">
        <div>
          <div style="font-weight:600; font-size:0.8rem">${escHtml(d.name)}</div>
          <div class="sub-text">${d.date}</div>
        </div>
        <div class="badge red">High</div>
      </div>
    `).join('');
  }

  const box = $('calMilestoneBox');
  if (state.deadlines.length === 0) {
    box.innerHTML = `<div class="empty-state">No upcoming deadlines.</div>`;
  } else {
    const d = state.deadlines[0];
    box.innerHTML = `
      <div class="mb-2 font-bold" style="font-weight:700">${escHtml(d.name)}</div>
      <div class="sub-text mb-2">${d.date}</div>
      <div class="badge red">Priority High</div>
    `;
  }
}

function renderHabits() {
  const days = ['M','T','W','T','F','S','S'];
  if (state.habits.length === 0) {
    $('habitMiniList').innerHTML = `<div class="empty-state">No rituals yet.</div>`;
    $('habitFullList').innerHTML = `<div class="empty-state">No habits planted.</div>`;
    $('gardenText').textContent = `No habits planted yet`;
  } else {
    $('habitMiniList').innerHTML = state.habits.slice(0, 3).map(h => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding: 8px 0; border-bottom: 1px solid #222">
        <div style="display:flex; gap:12px; align-items:center">
          <span style="font-size:1.2rem">${h.icon}</span>
          <span style="font-size:0.85rem; font-weight:500">${escHtml(h.name)}</span>
        </div>
        <span class="sub-text">🔥 ${h.streak}</span>
      </div>
    `).join('');

    $('habitFullList').innerHTML = state.habits.map(h => `
      <div class="habit-full-row">
        <div class="habit-icon">${h.icon}</div>
        <div class="habit-info">
          <div class="habit-name">${escHtml(h.name)}</div>
          <div class="habit-sub">${h.streak} day streak</div>
        </div>
        <div class="habit-days">
          ${h.days.map((d, i) => `
            <div class="h-day ${d ? 'done' : ''}" onclick="toggleHabitDay(${h.id}, ${i})">${days[i]}</div>
          `).join('')}
        </div>
      </div>
    `).join('');

    const totalStreak = state.habits.reduce((acc, h) => acc + h.streak, 0);
    $('gardenText').textContent = `Growing tall... ${totalStreak} days of care`;
    if (totalStreak > 20) $('gardenWidget').querySelector('.garden-icon').textContent = '🌳';
    else if (totalStreak > 10) $('gardenWidget').querySelector('.garden-icon').textContent = '🌿';
  }
}

// ── CALENDAR ──
let calDate = new Date();
let calSelectedDate = new Date();

function renderCalendar() {
  const y = calDate.getFullYear();
  const m = calDate.getMonth();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  $('calMonthLabel').textContent = new Date(y, m).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const dows = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
  let html = dows.map(d => `<div class="cal-dow">${d}</div>`).join('');

  const startPad = firstDay === 0 ? 6 : firstDay - 1;
  for (let i = 0; i < startPad; i++) html += `<div class="cal-day empty"></div>`;

  const todayStr = getLocalDateString();

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === getLocalDateString(calSelectedDate);

    const evs = state.events.filter(e => e.date === dateStr);
    const evHtml = evs.slice(0, 2).map(e => `<div class="cal-event-pill">${escHtml(e.title)}</div>`).join('');

    html += `
      <div class="cal-day ${isToday ? 'today' : ''}" onclick="selectCalDate('${dateStr}')" style="${isSelected ? 'background:rgba(40,40,40,0.8); border: 1px solid var(--accent)' : ''}">
        <div class="cal-day-num">${d}</div>
        ${evHtml}
      </div>
    `;
  }
  $('calendarGrid').innerHTML = html;
  renderCalDetail();
}

window.selectCalDate = (dateStr) => {
  calSelectedDate = new Date(dateStr + 'T12:00:00');
  renderCalendar();
};

function renderCalDetail() {
  const dateStr = getLocalDateString(calSelectedDate);
  const isToday = dateStr === getLocalDateString();

  $('calDetailDate').textContent = calSelectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  $('calTodayBadge').style.display = isToday ? 'inline-block' : 'none';

  const evs = state.events.filter(e => e.date === dateStr);
  if (evs.length === 0) {
    $('calDetailTimeline').innerHTML = `<div class="empty-state" style="padding:20px 0; text-align:center">No events scheduled.</div>`;
  } else {
    $('calDetailTimeline').innerHTML = evs.map(e => `
      <div class="timeline-item">
        <div class="time">ALL</div>
        <div class="timeline-content">
          <div class="tl-title">${escHtml(e.title)}</div>
        </div>
      </div>
    `).join('');
  }
}

window.calNav = (dir) => {
  if (dir === 0) {
    calDate = new Date();
    calSelectedDate = new Date();
  } else {
    calDate.setMonth(calDate.getMonth() + dir);
  }
  renderCalendar();
};

// ── CHARTS ──
function renderCharts() {
  const chart = $('weeklyChart');
  const focusHours = state.stats.minutes / 60;
  const max = Math.max(focusHours, 10);
  const mockData = [focusHours * 0.8, focusHours * 1.2, focusHours * 0.5, focusHours * 1.5, focusHours * 0.3, 0, 0];

  chart.innerHTML = ['M','T','W','T','F','S','S'].map((day, i) => `
    <div class="bar-wrap">
      <div class="bar" style="height: ${(mockData[i]/max)*100}%"></div>
      <span>${day}</span>
    </div>
  `).join('');

  const totalHours = Math.floor(state.stats.minutes / 60);
  const target = 100;
  const pct = Math.min((totalHours / target) * 100, 100);
  $('donutChart').style.background = `conic-gradient(var(--accent) 0% ${pct}%, #333 ${pct}% 100%)`;
  $('donutTotal').textContent = totalHours;
}

// ── SAVE ACTIONS ──
window.toggleHabitDay = (id, dayIdx) => {
  const h = state.habits.find(x => x.id === id);
  h.days[dayIdx] = h.days[dayIdx] ? 0 : 1;
  if(h.days[dayIdx]) h.streak++;
  else h.streak = Math.max(0, h.streak - 1);
  save(); renderHabits(); renderStats();
};

window.saveTask = () => {
  const text = $('taskNameInp').value.trim();
  const tag = $('taskTagInp').value.trim() || 'Focus';
  if (!text) return;
  state.tasks.push({ id: Date.now(), text, tag, done: false });
  $('taskNameInp').value = ''; $('taskTagInp').value = '';
  closeModal('taskModal');
  save(); renderTasks(); showNotif('Objective added!');
};

window.saveHabit = () => {
  const name = $('habitNameInp').value.trim();
  if (!name) return;
  const icons = ['📚', '💪', '🏃', '🧘', '💧', '🎸', '✍️', '🌿'];
  const icon = icons[Math.floor(Math.random() * icons.length)];
  state.habits.push({ id: Date.now(), name, icon, streak: 0, days: [0,0,0,0,0,0,0] });
  $('habitNameInp').value = '';
  closeModal('habitModal');
  save(); renderHabits(); showNotif('Ritual added!');
};

window.saveDeadline = () => {
  const name = $('dlNameInp').value.trim();
  const date = $('dlDateInp').value;
  if (!name || !date) return;
  state.deadlines.push({ id: Date.now(), name, date });
  $('dlNameInp').value = '';
  closeModal('dlModal');
  save(); renderDeadlines(); showNotif('Deadline added!');
};

window.saveEvent = () => {
  const title = $('evTitleInp').value.trim();
  const date = $('evDateInp').value;
  if (!title || !date) return;
  state.events.push({ id: Date.now(), title, date });
  $('evTitleInp').value = '';
  closeModal('evModal');
  save(); renderCalendar(); showNotif('Event added!');
};

// ── AUDIO DASHBOARD ──
const AUDIO_TRACKS = [
  { id: 'rain', name: 'Rain', icon: '🌧️', file: 'sounds/rain.mp3' },
  { id: 'ocean', name: 'Ocean', icon: '🌊', file: 'sounds/ocean.mp3' },
  { id: 'forest', name: 'Forest', icon: '🌲', file: 'sounds/forest.mp3' },
  { id: 'cafe', name: 'Cafe', icon: '☕', file: 'sounds/cafe.mp3' }
];

let audioEl = new Audio();
audioEl.loop = true;
audioEl.volume = 0.5;

window.renderAudioGrid = () => {
  $('audioGrid').innerHTML = AUDIO_TRACKS.map(t => `
    <div class="audio-option ${state.prefs.currentTrack === t.id ? 'active' : ''}" onclick="selectAudio('${t.id}')">
      <div class="audio-option-icon">${t.icon}</div>
      <div class="audio-option-name">${t.name}</div>
    </div>
  `).join('');

  $('audioPlayBtn').textContent = state.prefs.audioOn ? 'Pause Ambience' : 'Play Ambience';
};

window.selectAudio = (trackId) => {
  state.prefs.currentTrack = trackId;
  save();

  const track = AUDIO_TRACKS.find(t => t.id === trackId);
  audioEl.src = track.file;

  if (state.prefs.audioOn) {
    audioEl.play().catch(() => showNotif('Audio file not found.'));
  }

  renderAudioGrid();
  updateSidebarAudioUI();
};

window.toggleAudioPlay = () => {
  state.prefs.audioOn = !state.prefs.audioOn;
  save();

  if (state.prefs.audioOn) {
    if (!audioEl.src) {
      const track = AUDIO_TRACKS.find(t => t.id === state.prefs.currentTrack);
      audioEl.src = track.file;
    }
    audioEl.play().catch(() => showNotif('Audio file not found.'));
  } else {
    audioEl.pause();
  }

  renderAudioGrid();
  updateSidebarAudioUI();
};

window.toggleSidebarAudio = () => {
  toggleAudioPlay();
  $('audioSidebarToggle').classList.toggle('on', state.prefs.audioOn);
};

function updateSidebarAudioUI() {
  const track = AUDIO_TRACKS.find(t => t.id === state.prefs.currentTrack) || AUDIO_TRACKS[0];
  $('sidebarTrackName').textContent = state.prefs.audioOn ? track.name : 'Paused';
  $('sidebarTrackType').textContent = 'Ambient';
  $('sbAudioIcon').textContent = track.icon;
  $('audioSidebarToggle').classList.toggle('on', state.prefs.audioOn);
}

// ── INIT ──
function escHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function showNotif(msg) {
  const el = $('notif');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  updateTimerUI();
  renderTasks();
  renderDeadlines();
  renderHabits();
  renderCalendar();
  updateSidebarAudioUI();
  updateProfileUI();

  const track = AUDIO_TRACKS.find(t => t.id === state.prefs.currentTrack);
  if(track) audioEl.src = track.file;

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });
  });
});
