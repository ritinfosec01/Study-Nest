import {state, save} from '../state.js';
import {clampInt, escHtml, $, parseYMD, ymd} from '../utils.js';
import {showNotif} from '../ui/notifications.js';

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

export function renderEvColors(){
  $('evColors').innerHTML = EVENT_COLORS.map(c=>{
    const cls = 'ev-color' + (c.id==='none' ? ' none' : '') + (c.id===evSelectedColor ? ' selected' : '');
    const style = c.val ? `background:${c.val}` : '';
    return `<div class="${cls}" style="${style}" data-color="${c.id}" onclick="selectEvColor('${c.id}')" title="${c.id}"></div>`;
  }).join('');
}
export function selectEvColor(id){
  evSelectedColor = id;
  renderEvColors();
}
function eventColorVal(id){
  const c = EVENT_COLORS.find(x=>x.id===id);
  return c && c.val ? c.val : '#6b6b6b';
}

export function openEvModal(dateStr){
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
export function openEvModalForEdit(id){
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
export function closeEvModal(){ $('evModal').classList.remove('open'); }

export function saveEvent(){
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
export function delEvent(id){
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

export function renderSchedule(){
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
export function buildCalendar(){
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
export function calNav(delta){
  calMonth += delta;
  if(calMonth < 0){ calMonth = 11; calYear--; }
  else if(calMonth > 11){ calMonth = 0; calYear++; }
  buildCalendar();
}
export function calToday(){
  const t = new Date();
  calYear = t.getFullYear(); calMonth = t.getMonth();
  buildCalendar();
}
export function calCellClick(dateStr){
  showCalDayDetail(dateStr);
}
export function showCalDayDetail(dateStr){
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
