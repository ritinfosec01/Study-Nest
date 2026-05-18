// ────────────────────────────────────────────────────────────
// StudyNest — main script
// ────────────────────────────────────────────────────────────

const LS_KEY = 'studynest_v1';
const state = loadState();

function loadState(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(raw) return JSON.parse(raw);
  }catch(e){}
  return {
    tasks:[], deadlines:[], events:[],
    habits:[
      {id:1,name:'Morning run',icon:'🏃',streak:3,days:[1,1,1,0,0,0,0]},
      {id:2,name:'Read 30 mins',icon:'📖',streak:5,days:[1,1,1,1,1,0,0]},
      {id:3,name:'Meditate',icon:'🧘',streak:2,days:[0,1,1,0,0,0,0]},
    ],
    stats:{sessTotal:0, minTotal:0},
    prefs:{accent:'#f5a623', preset:0, bg:'night', opts:{quote:true,auto:false,dim:true}},
  };
}
function save(){
  try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); }catch(e){}
}

// ── UTIL ──
function escHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function $(id){return document.getElementById(id)}
function ymd(date){
  const d = new Date(date);
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function parseYMD(s){
  const [y,m,d] = s.split('-').map(Number);
  return new Date(y, m-1, d);
}

// ── QUOTES ──
const quotes=[
  {text:"Never give up on a dream just because of the time it will take to accomplish it.",author:"Earl Nightingale"},
  {text:"The secret of getting ahead is getting started.",author:"Mark Twain"},
  {text:"It always seems impossible until it's done.",author:"Nelson Mandela"},
  {text:"Don't watch the clock; do what it does. Keep going.",author:"Sam Levenson"},
  {text:"You don't have to be great to start, but you have to start to be great.",author:"Zig Ziglar"},
  {text:"Push yourself, because no one else is going to do it for you.",author:"Unknown"},
  {text:"Little by little, a little becomes a lot.",author:"Tanzanian Proverb"},
  {text:"Success is the sum of small efforts, repeated day in and day out.",author:"Robert Collier"},
];
function setQuote(){
  const q=quotes[Math.floor(Math.random()*quotes.length)];
  $('quoteText').innerHTML = `"${escHtml(q.text)}"<br><span style="font-size:.68rem;opacity:.65;font-style:normal">— ${escHtml(q.author)}</span>`;
}

// ── VIEW ROUTER ──
const VIEWS = ['dashboard','calendar','habits','customize','music','background'];
function showView(name){
  document.querySelectorAll('.sb-item').forEach(b=>{
    b.classList.toggle('active', b.dataset.view === name);
  });
  const dash = $('dashView');
  VIEWS.filter(v=>v!=='dashboard').forEach(v=>$(v+'View').classList.remove('active'));
  if(name === 'dashboard'){
    dash.style.display = 'flex';
    return;
  }
  dash.style.display = 'none';
  $(name+'View').classList.add('active');
  if(name === 'calendar')   buildCalendar();
  if(name === 'habits')     buildHabits();
  if(name === 'music')      buildMusicView();
  if(name === 'background') buildBgView();
  if(name === 'customize')  buildCustomize();
}

// ── TIMER ──
const timerModes={
  pomodoro:{secs:25*60,label:'Focus',break:false},
  short:{secs:5*60,label:'Short Break',break:true},
  long:{secs:15*60,label:'Long Break',break:true}
};
let curMode='pomodoro', secsLeft=25*60, totalSecs=25*60;
let running=false, interval=null, sessCount=0;

function setMode(mode, tabEl){
  if(running) pauseTimer();
  curMode = mode;
  const m = timerModes[mode];
  totalSecs = m.secs;
  secsLeft = m.secs;
  document.querySelectorAll('.tmtab').forEach(t=>{
    t.classList.toggle('active', t.dataset.mode === mode);
  });
  $('timerDigits').classList.toggle('break', m.break);
  updateTimerDisplay();
  $('startBtn').textContent='Start';
}
function toggleTimer(){ running ? pauseTimer() : startTimer(); }
function startTimer(){
  running=true;
  $('startBtn').textContent='Pause';
  interval=setInterval(tick,1000);
}
function pauseTimer(){
  running=false;
  $('startBtn').textContent='Resume';
  clearInterval(interval);
}
function resetTimer(){
  pauseTimer();
  secsLeft=totalSecs;
  $('startBtn').textContent='Start';
  updateTimerDisplay();
}
function skipMode(){
  if(curMode==='pomodoro'){
    sessCount=(sessCount+1)%4;
    setMode(sessCount===0?'long':'short', null);
  } else {
    setMode('pomodoro', null);
  }
  renderSessionDots();
}
function tick(){
  if(secsLeft<=0){ onEnd(); return; }
  secsLeft--;
  if(curMode==='pomodoro') state.stats.minTotal += 1/60;
  updateTimerDisplay();
  document.title=(running?'▶ ':'')+fmtTime(secsLeft)+' — StudyNest';
}
function onEnd(){
  clearInterval(interval); running=false;
  if(curMode==='pomodoro'){
    state.stats.sessTotal++;
    sessCount=(sessCount+1)%4;
    save();
    updateWeekStats();
    showNotif('🎉 Session complete!');
    setTimeout(()=>setMode(sessCount===0?'long':'short', null), 800);
  } else {
    showNotif('☕ Break over — time to focus!');
    setTimeout(()=>setMode('pomodoro', null), 800);
  }
  $('startBtn').textContent='Start';
  renderSessionDots();
}
function fmtTime(s){return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
function updateTimerDisplay(){$('timerDigits').textContent = fmtTime(secsLeft)}
function renderSessionDots(){
  const wrap=$('sessionDots');
  wrap.innerHTML='';
  for(let i=0;i<4;i++){
    const d=document.createElement('div');
    d.className='sdot'+(i<sessCount?' done':i===sessCount?' current':'');
    wrap.appendChild(d);
  }
}

// ── WEEK STATS ──
let weekOffset=0;
function updateWeekStats(){
  const m = state.stats;
  const tasksDoneCount = state.tasks.filter(t=>t.done).length;
  $('wSessions').textContent = m.sessTotal;
  $('wHrs').textContent = Math.floor(m.minTotal/60);
  $('wMins').textContent = Math.floor(m.minTotal%60);
  $('wTasks').textContent = tasksDoneCount;
  $('levelText').textContent = m.sessTotal<5?'Novice':m.sessTotal<15?'Student':m.sessTotal<30?'Scholar':'Master';
}
function changeWeek(d){ weekOffset+=d; buildWeekLabel(); }
function buildWeekLabel(){
  const now=new Date(); now.setDate(now.getDate()+weekOffset*7);
  const mon=new Date(now); mon.setDate(now.getDate()-((now.getDay()+6)%7));
  const sun=new Date(mon); sun.setDate(mon.getDate()+6);
  const fmt=d=>d.toLocaleDateString('en-US',{month:'short',day:'numeric'}).toUpperCase();
  $('weekLabel').textContent = fmt(mon)+' – '+fmt(sun);
}

// ── HABITS ──
const DAY_LABELS=['M','T','W','T','F','S','S'];

function buildHabitMini(){
  const card=$('habitMiniCard');
  const habits = state.habits;
  if(!habits.length){
    card.innerHTML = `<div class="habit-mini-title">Habits</div><div class="schedule-empty">No habits yet</div>`;
    return;
  }
  let html = `<div class="habit-mini-title">Habits</div>`;
  habits.slice(0,3).forEach(h=>{
    html += `<div class="habit-mini-row"><span class="habit-mini-name">${escHtml(h.icon)} ${escHtml(h.name)}</span><div class="habit-dots">`;
    h.days.slice(0,7).forEach((done,i)=>{
      html += `<div class="habit-dot${done?' done':''}" onclick="toggleHabitDay(${h.id},${i})" title="${DAY_LABELS[i]}">${DAY_LABELS[i]}</div>`;
    });
    html += '</div></div>';
  });
  card.innerHTML = html;
}
function toggleHabitDay(id, dayIdx){
  const h = state.habits.find(x=>x.id===id);
  if(!h) return;
  h.days[dayIdx] = h.days[dayIdx] ? 0 : 1;
  save(); buildHabitMini(); buildHabits();
}
function buildHabits(){
  const list = $('habitsList');
  if(!list) return;
  list.innerHTML = '';
  state.habits.forEach(h=>{
    const el = document.createElement('div');
    el.className = 'habit-card-full';
    el.innerHTML = `
      <div class="habit-icon">${escHtml(h.icon)}</div>
      <div class="habit-info">
        <div class="habit-info-name">${escHtml(h.name)}</div>
        <div class="habit-info-streak">🔥 ${h.streak} day streak</div>
      </div>
      <div class="habit-week-dots">${h.days.map((d,i)=>`<div class="hw-dot${d?' done':''}" onclick="toggleHabitDay(${h.id},${i})" title="${DAY_LABELS[i]}">${DAY_LABELS[i]}</div>`).join('')}</div>
      <button class="habit-del" onclick="deleteHabit(${h.id})" aria-label="Delete habit">✕</button>`;
    list.appendChild(el);
  });
}
function addHabit(){
  const name = prompt('Habit name?');
  if(!name || !name.trim()) return;
  const icons=['📚','💪','🏃','🧘','💧','🎸','✍️','🌿'];
  const icon = icons[Math.floor(Math.random()*icons.length)];
  state.habits.push({id:Date.now(), name:name.trim(), icon, streak:0, days:[0,0,0,0,0,0,0]});
  save(); buildHabits(); buildHabitMini(); showNotif('Habit added!');
}
function deleteHabit(id){
  state.habits = state.habits.filter(h=>h.id!==id);
  save(); buildHabits(); buildHabitMini();
}

// ── TASKS ──
function addTask(){
  const inp = $('taskInp');
  const val = inp.value.trim();
  if(!val) return;
  state.tasks.push({id:Date.now(), text:val, done:false});
  inp.value=''; save(); renderTasks();
}
function renderTasks(){
  const ip = state.tasks.filter(t=>!t.done);
  const done = state.tasks.filter(t=>t.done);
  const renderList = (list, elId)=>{
    const ul = $(elId);
    ul.innerHTML = '';
    if(!list.length){
      const li = document.createElement('li');
      li.className = 'no-tasks';
      li.textContent = 'No tasks here';
      ul.appendChild(li);
      return;
    }
    list.forEach(t=>{
      const li = document.createElement('li');
      li.className = 'task-item';
      li.innerHTML = `
        <button class="task-check${t.done?' done':''}" onclick="toggleTask(${t.id})" aria-label="Toggle"></button>
        <span class="task-text${t.done?' done':''}">${escHtml(t.text)}</span>
        <button class="task-del" onclick="delTask(${t.id})" aria-label="Delete">✕</button>`;
      ul.appendChild(li);
    });
  };
  renderList(ip, 'taskListIp');
  renderList(done, 'taskListDone');
  updateWeekStats();
}
function toggleTask(id){
  const t = state.tasks.find(x=>x.id===id);
  if(t){ t.done = !t.done; save(); renderTasks(); }
}
function delTask(id){
  state.tasks = state.tasks.filter(x=>x.id!==id);
  save(); renderTasks();
}
function toggleSection(key){
  const labelId = key==='ip' ? 'ipLabel' : 'doneLabel';
  const listId  = key==='ip' ? 'taskListIp' : 'taskListDone';
  const label = $(labelId);
  const list  = $(listId);
  if(!label || !list) return;
  label.classList.toggle('open');
  list.style.display = label.classList.contains('open') ? '' : 'none';
}

// ── DEADLINES ──
function openDlModal(){
  $('dlDate').value = ymd(new Date());
  $('dlModal').classList.add('open');
}
function closeDlModal(){ $('dlModal').classList.remove('open'); }
function saveDeadline(){
  const name = $('dlName').value.trim();
  const date = $('dlDate').value;
  const color = $('dlColor').value;
  if(!name || !date){ showNotif('Fill in all fields!'); return; }
  state.deadlines.push({id:Date.now(), name, date, color});
  $('dlName').value=''; $('dlDate').value='';
  save(); closeDlModal(); renderDeadlines(); showNotif('Deadline added!');
}
function renderDeadlines(){
  const el = $('deadlinesList');
  if(!state.deadlines.length){
    el.innerHTML = '<div class="dl-empty">No deadlines for now! :)</div>';
    return;
  }
  el.innerHTML = state.deadlines.map(d=>`
    <div class="dl-item">
      <div class="dl-dot" style="background:${d.color}"></div>
      <div class="dl-info">
        <div class="dl-name">${escHtml(d.name)}</div>
        <div class="dl-date">${new Date(d.date+'T00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
      </div>
      <button class="dl-del" onclick="delDl(${d.id})" aria-label="Delete">✕</button>
    </div>`).join('');
}
function delDl(id){
  state.deadlines = state.deadlines.filter(d=>d.id!==id);
  save(); renderDeadlines();
}

// ────────────────────────────────────────────────────────────
// EVENT SYSTEM (modal + calendar + dashboard schedule)
// ────────────────────────────────────────────────────────────
const EVENT_COLORS = [
  {id:'red',    val:'#e05c5c'},
  {id:'orange', val:'#f5a623'},
  {id:'teal',   val:'#2cc4b5'},
  {id:'blue',   val:'#4a90d9'},
  {id:'purple', val:'#7c6af7'},
  {id:'green',  val:'#6dc05e'},
  {id:'none',   val:''},  // gray "no color"
];
let evSelectedColor = 'teal';
let evEditingId = null;
let evDefaultDate = null;

function renderEvColors(){
  $('evColors').innerHTML = EVENT_COLORS.map(c=>{
    const cls = 'ev-color' + (c.id==='none' ? ' none' : '') + (c.id===evSelectedColor ? ' selected' : '');
    const style = c.val ? `background:${c.val}` : '';
    return `<div class="${cls}" style="${style}" data-color="${c.id}" onclick="selectEvColor('${c.id}')" title="${c.id}"></div>`;
  }).join('');
}
function selectEvColor(id){
  evSelectedColor = id;
  renderEvColors();
}
function eventColorVal(id){
  const c = EVENT_COLORS.find(x=>x.id===id);
  return c && c.val ? c.val : '#6b6b6b';
}

function openEvModal(dateStr){
  evEditingId = null;
  evDefaultDate = dateStr || ymd(new Date());
  $('evTitle').value = '';
  $('evNote').value  = '';
  $('evDate').value  = evDefaultDate;
  $('evStartH').value = 9; $('evStartM').value = 0; $('evStartAP').value = 'AM';
  $('evEndH').value   = 10; $('evEndM').value  = 0; $('evEndAP').value   = 'AM';
  $('evRepeat').value = 'never';
  $('evCreateLabel').textContent = 'Create';
  evSelectedColor = 'teal';
  renderEvColors();
  $('evModal').classList.add('open');
  setTimeout(()=>$('evTitle').focus(), 50);
}
function openEvModalForEdit(id){
  const ev = state.events.find(e=>e.id===id);
  if(!ev) return openEvModal();
  evEditingId = id;
  $('evTitle').value  = ev.title;
  $('evNote').value   = ev.note || '';
  $('evDate').value   = ev.date;
  const set = (h,m,ap, hId, mId, apId)=>{ $(hId).value=h; $(mId).value=m; $(apId).value=ap; };
  set(ev.startH, ev.startM, ev.startAP, 'evStartH','evStartM','evStartAP');
  set(ev.endH,   ev.endM,   ev.endAP,   'evEndH',  'evEndM',  'evEndAP');
  $('evRepeat').value = ev.repeat || 'never';
  evSelectedColor = ev.color || 'teal';
  $('evCreateLabel').textContent = 'Save';
  renderEvColors();
  $('evModal').classList.add('open');
  setTimeout(()=>$('evTitle').focus(), 50);
}
function closeEvModal(){ $('evModal').classList.remove('open'); }

function saveEvent(){
  const title = $('evTitle').value.trim();
  const date  = $('evDate').value;
  if(!title){ showNotif('Title is required'); $('evTitle').focus(); return; }
  if(!date){  showNotif('Date is required');  $('evDate').focus();  return; }
  const ev = {
    id: evEditingId || Date.now(),
    title,
    note: $('evNote').value.trim(),
    date,
    startH: clampInt($('evStartH').value,1,12,9),
    startM: clampInt($('evStartM').value,0,59,0),
    startAP: $('evStartAP').value,
    endH:   clampInt($('evEndH').value,1,12,10),
    endM:   clampInt($('evEndM').value,0,59,0),
    endAP:  $('evEndAP').value,
    color:  evSelectedColor,
    repeat: $('evRepeat').value,
  };
  if(evEditingId){
    const i = state.events.findIndex(x=>x.id===evEditingId);
    if(i>=0) state.events[i] = ev;
    showNotif('Event updated!');
  } else {
    state.events.push(ev);
    showNotif('Event added!');
  }
  save();
  closeEvModal();
  renderSchedule();
  if($('calendarView').classList.contains('active')) buildCalendar();
}
function clampInt(v,min,max,fallback){
  let n = parseInt(v,10);
  if(isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
function delEvent(id){
  state.events = state.events.filter(e=>e.id!==id);
  save();
  renderSchedule();
  if($('calendarView').classList.contains('active')) buildCalendar();
}
function eventTimeLabel(ev){
  const pad = n => String(n).padStart(2,'0');
  return `${ev.startH}:${pad(ev.startM)} ${ev.startAP} – ${ev.endH}:${pad(ev.endM)} ${ev.endAP}`;
}
function eventStartMinutes(ev){
  let h = ev.startH % 12;
  if(ev.startAP === 'PM') h += 12;
  return h*60 + ev.startM;
}
function eventsForDate(dateStr){
  return state.events
    .filter(e=>e.date === dateStr)
    .sort((a,b)=>eventStartMinutes(a)-eventStartMinutes(b));
}

function renderSchedule(){
  const today = ymd(new Date());
  const list = eventsForDate(today);
  const el = $('scheduleList');
  if(!list.length){
    el.innerHTML = `<div class="schedule-empty">Nothing scheduled today.<br>Click <b>+ Event</b> to add one.</div>`;
    return;
  }
  el.innerHTML = list.map(ev=>`
    <div class="sched-item" onclick="openEvModalForEdit(${ev.id})">
      <div class="sched-bar" style="background:${eventColorVal(ev.color)}"></div>
      <div class="sched-info">
        <div class="sched-name">${escHtml(ev.title)}</div>
        <div class="sched-time">${eventTimeLabel(ev)}</div>
      </div>
      <button class="sched-del" onclick="event.stopPropagation();delEvent(${ev.id})" aria-label="Delete">✕</button>
    </div>`).join('');
}

// ── CALENDAR ──
let calYear, calMonth;
function buildCalendar(){
  const today = new Date();
  if(calYear === undefined){ calYear = today.getFullYear(); calMonth = today.getMonth(); }
  const y = calYear, m = calMonth;
  const firstDay = new Date(y,m,1).getDay();
  const daysInMonth = new Date(y,m+1,0).getDate();
  const monthName = new Date(y,m,1).toLocaleDateString('en-US',{month:'long',year:'numeric'});

  let html = `<div class="cal-month-head">
    <div class="cal-month-title">${monthName}</div>
    <div class="cal-month-nav">
      <button onclick="calNav(-1)">‹</button>
      <button onclick="calToday()">Today</button>
      <button onclick="calNav(1)">›</button>
    </div>
  </div>
  <div class="cal-grid">`;
  ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(d=>html+=`<div class="cal-cell hdr">${d}</div>`);
  const startPad = (firstDay===0?6:firstDay-1);
  for(let i=0;i<startPad;i++) html += `<div class="cal-cell empty"></div>`;
  for(let d=1; d<=daysInMonth; d++){
    const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = (d===today.getDate() && m===today.getMonth() && y===today.getFullYear());
    const evs = eventsForDate(dateStr);
    const evHtml = evs.slice(0,3).map(e=>`<div class="cal-ev" style="background:${eventColorVal(e.color)}" onclick="event.stopPropagation();openEvModalForEdit(${e.id})">${escHtml(e.title)}</div>`).join('');
    const more = evs.length>3 ? `<div class="cal-more">+${evs.length-3} more</div>` : '';
    html += `<div class="cal-cell${isToday?' today':''}" onclick="calCellClick('${dateStr}')">
      <div class="cal-day">${d}</div>
      <div class="cal-events">${evHtml}${more}</div>
    </div>`;
  }
  html += '</div>';
  html += `<div class="cal-day-detail" id="calDayDetail"></div>`;
  $('calContent').innerHTML = html;
  showCalDayDetail(ymd(today));
}
function calNav(delta){
  calMonth += delta;
  if(calMonth < 0){ calMonth = 11; calYear--; }
  else if(calMonth > 11){ calMonth = 0; calYear++; }
  buildCalendar();
}
function calToday(){
  const t = new Date();
  calYear = t.getFullYear(); calMonth = t.getMonth();
  buildCalendar();
}
function calCellClick(dateStr){
  showCalDayDetail(dateStr);
}
function showCalDayDetail(dateStr){
  const wrap = $('calDayDetail');
  if(!wrap) return;
  const d = parseYMD(dateStr);
  const label = d.toLocaleDateString('en-US',{weekday:'long', month:'long', day:'numeric', year:'numeric'});
  const evs = eventsForDate(dateStr);
  let inner = `<div class="cal-day-detail-head">
    <div class="cal-day-detail-title">${label}</div>
    <button class="btn-new-event" onclick="openEvModal('${dateStr}')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>
      New Event
    </button>
  </div>`;
  if(!evs.length){
    inner += `<div class="cal-day-empty">No events on this day.</div>`;
  } else {
    inner += `<div class="schedule-list" style="overflow:visible">` + evs.map(ev=>`
      <div class="sched-item" onclick="openEvModalForEdit(${ev.id})">
        <div class="sched-bar" style="background:${eventColorVal(ev.color)}"></div>
        <div class="sched-info">
          <div class="sched-name">${escHtml(ev.title)}${ev.note?` — <span style="color:var(--muted);font-weight:400">${escHtml(ev.note)}</span>`:''}</div>
          <div class="sched-time">${eventTimeLabel(ev)}</div>
        </div>
        <button class="sched-del" onclick="event.stopPropagation();delEvent(${ev.id})" aria-label="Delete">✕</button>
      </div>`).join('') + `</div>`;
  }
  wrap.innerHTML = inner;
}

// ── MUSIC (real mp3 files in /sounds) ──
let currentAudio = null, currentSoundId = null;
let globalVol = 0.4;
const musicDefs = [
  {id:'rain',    name:'Rain',         type:'Nature', emoji:'🌧️', cat:'Nature', file:'sounds/rain.mp3'},
  {id:'thunder', name:'Thunderstorm', type:'Nature', emoji:'⛈️', cat:'Nature', file:'sounds/thunder.mp3'},
  {id:'forest',  name:'Forest',       type:'Nature', emoji:'🌲', cat:'Nature', file:'sounds/forest.mp3'},
  {id:'ocean',   name:'Ocean Waves',  type:'Nature', emoji:'🌊', cat:'Nature', file:'sounds/ocean.mp3'},
  {id:'fire',    name:'Fireplace',    type:'Cozy',   emoji:'🔥', cat:'Cozy',   file:'sounds/fire.mp3'},
  {id:'cafe',    name:'Coffee Shop',  type:'Cozy',   emoji:'☕', cat:'Cozy',   file:'sounds/cafe.mp3'},
  {id:'wind',    name:'Gentle Wind',  type:'Nature', emoji:'💨', cat:'Nature', file:'sounds/wind.mp3'},
  {id:'white',   name:'White Noise',  type:'Focus',  emoji:'🌫️', cat:'Focus',  file:'sounds/white.mp3'},
];
const musicCats = ['All','Nature','Cozy','Focus'];
let activeCat='All', searchQ='';

function setVol(v){
  globalVol = v/100;
  if(currentAudio) currentAudio.volume = globalVol;
}
function stopMusic(){
  if(currentAudio){
    try{ currentAudio.pause(); currentAudio.src = ''; }catch(e){}
    currentAudio = null;
  }
  currentSoundId = null;
  $('nowPlayingBar').classList.remove('visible');
  document.querySelectorAll('.music-card').forEach(c=>c.classList.remove('playing'));
}
function togglePlayback(){
  if(!currentAudio) return;
  if(currentAudio.paused){ currentAudio.play().catch(()=>{}); $('npPlayBtn').textContent = '||'; }
  else { currentAudio.pause(); $('npPlayBtn').textContent = '▶'; }
}
function playSound(def){
  if(currentSoundId === def.id){ stopMusic(); return; }
  stopMusic();
  currentSoundId = def.id;
  const a = new Audio(def.file);
  a.loop = true;
  a.volume = globalVol;
  a.play().catch(err => {
    showNotif('Could not play ' + def.name);
    console.warn('audio play failed:', err);
  });
  currentAudio = a;
  $('npThumb').textContent = def.emoji;
  $('npName').textContent  = def.name;
  $('npType').textContent  = def.type;
  $('npPlayBtn').textContent = '||';
  $('nowPlayingBar').classList.add('visible');
  document.querySelectorAll('.music-card').forEach(c => c.classList.remove('playing'));
  const card = $('mc-' + def.id); if(card) card.classList.add('playing');
}
function buildMusicView(){
  $('musicCats').innerHTML = musicCats.map(c=>`<button class="music-cat${c===activeCat?' active':''}" onclick="setCat('${c}')">${c}</button>`).join('');
  renderMusicGrid();
}
function setCat(c){ activeCat=c; buildMusicView(); }
function filterMusic(){ searchQ=$('musicSearch').value.toLowerCase(); renderMusicGrid(); }
function renderMusicGrid(){
  const list = musicDefs.filter(d => (activeCat==='All'||d.cat===activeCat) && (d.name.toLowerCase().includes(searchQ)||d.type.toLowerCase().includes(searchQ)));
  $('musicGrid').innerHTML = list.map(d=>`
    <div class="music-card${currentSoundId===d.id?' playing':''}" id="mc-${d.id}" onclick='playSound(${JSON.stringify(d)})'>
      <div class="music-thumb">${d.emoji}</div>
      <div class="music-name">${d.name}</div>
      <div class="music-type">${d.type}</div>
    </div>`).join('');
}

// ── BACKGROUND ──
const bgOptions=[
  {id:'flowers',label:'White Flowers',css:'linear-gradient(135deg,#e8f5e9,#b2dfdb)'},
  {id:'night',label:'Night Sky',css:'linear-gradient(180deg,#0d0a05 0%,#1a0f02 40%,#2c1806 100%)'},
  {id:'forest',label:'Dark Forest',css:'linear-gradient(180deg,#0a1f0a,#1a3a1a,#2d5a2d)'},
  {id:'ocean',label:'Deep Ocean',css:'linear-gradient(180deg,#0a0a1f,#0d1b3e,#1a2a5c)'},
  {id:'sunset',label:'Warm Sunset',css:'linear-gradient(180deg,#1a0a00,#3d1a00,#6b3300,#a05020)'},
  {id:'lavender',label:'Lavender Dusk',css:'linear-gradient(180deg,#1a0a2e,#2d1554,#4a2080)'},
];
const bgColors=[
  {id:'black',label:'Pure Black',css:'#000000'},
  {id:'darkgray',label:'Dark Gray',css:'#0f0f0f'},
  {id:'navy',label:'Navy',css:'#0a0e1a'},
  {id:'darkgreen',label:'Dark Green',css:'#0a140a'},
  {id:'darkpurple',label:'Dark Purple',css:'#100a1a'},
  {id:'darkbrown',label:'Dark Brown',css:'#140a00'},
];
let customBgs = [];

async function loadCustomBgs(){
  try{
    const res = await fetch('backgrounds/manifest.json', {cache:'no-cache'});
    if(!res.ok) return [];
    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.images || []);
    return items.map(entry=>{
      const file  = typeof entry === 'string' ? entry : entry.file;
      const label = typeof entry === 'string' ? entry.replace(/\.[^.]+$/, '') : (entry.label || file);
      return {
        id:'custom-' + file,
        label,
        css:`url('backgrounds/${file}') center/cover no-repeat`,
      };
    });
  }catch(e){ return []; }
}

function allBgs(){ return [...customBgs, ...bgOptions]; }

function bgCssById(id){
  const all = [...customBgs, ...bgOptions, ...bgColors];
  return (all.find(b=>b.id===id) || bgOptions[1]).css;
}
function buildBgView(){
  const sel = state.prefs.bg;
  $('bgGrid').innerHTML = allBgs().map(b=>`
    <div class="bg-option${sel===b.id?' selected':''}" id="bg-${esc(b.id)}"
      style="background:${b.css}" onclick="setBg('${esc(b.id)}')">
      <div class="bg-option-label">${escHtml(b.label)}</div>
    </div>`).join('');
  $('bgColorGrid').innerHTML = bgColors.map(b=>`
    <div class="bg-color-option${sel===b.id?' selected':''}" id="bg-${b.id}"
      style="background:${b.css}" onclick="setBg('${b.id}')" title="${b.label}"></div>`).join('');
}
function esc(s){ return String(s).replace(/'/g, "\\'"); }
function setBg(id){
  state.prefs.bg = id;
  save();
  $('bgLayer').style.background = bgCssById(id);
  document.querySelectorAll('.bg-option,.bg-color-option').forEach(el=>el.classList.remove('selected'));
  const node = $('bg-'+id); if(node) node.classList.add('selected');
  showNotif('Background updated!');
}

// ── CUSTOMIZE ──
const accentColors=[
  {name:'Amber',val:'#f5a623'},{name:'Purple',val:'#7c6af7'},{name:'Teal',val:'#2cb67d'},
  {name:'Rose',val:'#e05c8a'},{name:'Blue',val:'#4a90d9'},{name:'Green',val:'#4caf7d'},
];
const timerPresets=[
  {label:'Classic',focus:25,short:5,long:15},
  {label:'Long',focus:50,short:10,long:30},
  {label:'Quick',focus:15,short:3,long:10},
  {label:'Deep',focus:90,short:20,long:45},
];

function buildCustomize(){
  const p = state.prefs;
  $('accentSwatches').innerHTML = accentColors.map(c=>`
    <div class="swatch${c.val===p.accent?' active':''}" style="background:${c.val}" onclick="setAccent('${c.val}')" title="${c.name}"></div>`).join('');
  $('timerPresets').innerHTML = timerPresets.map((pr,i)=>`
    <button class="preset-btn${i===p.preset?' active':''}" onclick="setPreset(${i})">${pr.label}<br><span style="opacity:.5;font-size:.6rem">${pr.focus}/${pr.short}/${pr.long}</span></button>`).join('');
  // sync toggles
  $('quoteToggle').classList.toggle('on', p.opts.quote);
  $('autoToggle').classList.toggle('on',  p.opts.auto);
  $('dimToggle').classList.toggle('on',   p.opts.dim);
}
function applyAccent(val){
  const root = document.documentElement.style;
  root.setProperty('--accent', val);
  root.setProperty('--accent-text', pickTextColor(val));
}
function pickTextColor(hex){
  const m = /^#?([a-f\d]{6})$/i.exec(hex.trim());
  if(!m) return '#111';
  const n = parseInt(m[1], 16);
  const r = (n>>16)&255, g = (n>>8)&255, b = n&255;
  const lum = (0.299*r + 0.587*g + 0.114*b) / 255;
  return lum > 0.62 ? '#111' : '#fff';
}
function setAccent(val){
  state.prefs.accent = val;
  applyAccent(val);
  save(); buildCustomize(); showNotif('Accent color updated!');
}
function setPreset(i){
  state.prefs.preset = i;
  const p = timerPresets[i];
  timerModes.pomodoro.secs = p.focus*60;
  timerModes.short.secs    = p.short*60;
  timerModes.long.secs     = p.long*60;
  setMode(curMode, null);
  save(); buildCustomize();
  showNotif(`Timer set to ${p.label} preset!`);
}
function toggleOpt(btn, key){
  btn.classList.toggle('on');
  state.prefs.opts[key] = btn.classList.contains('on');
  save();
  if(key==='quote') $('quoteText').style.opacity = state.prefs.opts.quote ? '1' : '0';
  if(key==='dim')   $('bgOverlay').style.opacity = state.prefs.opts.dim   ? '1' : '0.3';
}

// ── NOTIF ──
let notifT;
function showNotif(msg){
  const el = $('notif');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(notifT);
  notifT = setTimeout(()=>el.classList.remove('show'), 3000);
}

// ── MODAL DISMISS (click outside) ──
function setupModalDismiss(id){
  const el = $(id);
  el.addEventListener('click', e => { if(e.target === el) el.classList.remove('open'); });
}

// ── INIT ──
function init(){
  setQuote();
  buildWeekLabel();
  renderSessionDots();
  renderTasks();
  renderDeadlines();
  buildHabitMini();
  renderSchedule();

  // Apply saved prefs
  const p = state.prefs;
  applyAccent(p.accent);
  $('bgLayer').style.background = bgCssById(p.bg);

  // Load custom backgrounds from /backgrounds/manifest.json, then re-apply
  loadCustomBgs().then(list=>{
    customBgs = list;
    $('bgLayer').style.background = bgCssById(state.prefs.bg);
    if($('backgroundView').classList.contains('active')) buildBgView();
  });
  // Apply timer preset
  const tp = timerPresets[p.preset] || timerPresets[0];
  timerModes.pomodoro.secs = tp.focus*60;
  timerModes.short.secs    = tp.short*60;
  timerModes.long.secs     = tp.long*60;
  totalSecs = timerModes.pomodoro.secs;
  secsLeft  = totalSecs;
  updateTimerDisplay();
  updateWeekStats();

  // Toggles
  $('quoteToggle').classList.toggle('on', p.opts.quote);
  $('autoToggle').classList.toggle('on',  p.opts.auto);
  $('dimToggle').classList.toggle('on',   p.opts.dim);
  $('quoteText').style.opacity = p.opts.quote ? '1' : '0';
  $('bgOverlay').style.opacity = p.opts.dim   ? '1' : '0.3';

  // Modals dismiss on backdrop click
  setupModalDismiss('dlModal');
  setupModalDismiss('evModal');

  // Esc closes modals
  document.addEventListener('keydown', e=>{
    if(e.key==='Escape'){
      $('dlModal').classList.remove('open');
      $('evModal').classList.remove('open');
    }
  });
}

document.addEventListener('DOMContentLoaded', init);

// Expose for inline handlers
window.showView = showView;
window.setMode = setMode;
window.toggleTimer = toggleTimer;
window.resetTimer = resetTimer;
window.skipMode = skipMode;
window.changeWeek = changeWeek;
window.toggleHabitDay = toggleHabitDay;
window.addHabit = addHabit;
window.deleteHabit = deleteHabit;
window.addTask = addTask;
window.toggleTask = toggleTask;
window.delTask = delTask;
window.toggleSection = toggleSection;
window.openDlModal = openDlModal;
window.closeDlModal = closeDlModal;
window.saveDeadline = saveDeadline;
window.delDl = delDl;
window.openEvModal = openEvModal;
window.openEvModalForEdit = openEvModalForEdit;
window.closeEvModal = closeEvModal;
window.saveEvent = saveEvent;
window.delEvent = delEvent;
window.selectEvColor = selectEvColor;
window.calNav = calNav;
window.calToday = calToday;
window.calCellClick = calCellClick;
window.playSound = playSound;
window.stopMusic = stopMusic;
window.togglePlayback = togglePlayback;
window.setVol = setVol;
window.setCat = setCat;
window.filterMusic = filterMusic;
window.setBg = setBg;
window.setAccent = setAccent;
window.setPreset = setPreset;
window.toggleOpt = toggleOpt;
