import {state, save} from '../state.js';
import {escHtml, $, ymd} from '../utils.js';
import {showNotif} from '../ui/notifications.js';

// ── DEADLINES ──
export function openDlModal(){
  $('dlDate').value = ymd(new Date());
  $('dlModal').classList.add('open');
}
export function closeDlModal(){ $('dlModal').classList.remove('open'); }
export function saveDeadline(){
  const name = $('dlName').value.trim();
  const date = $('dlDate').value;
  const color = $('dlColor').value;
  if(!name || !date){ showNotif('Fill in all fields!'); return; }
  state.deadlines.push({id:Date.now(), name, date, color});
  $('dlName').value=''; $('dlDate').value='';
  save(); closeDlModal(); renderDeadlines(); showNotif('Deadline added!');
}
export function renderDeadlines(){
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
export function delDl(id){
  state.deadlines = state.deadlines.filter(d=>d.id!==id);
  save(); renderDeadlines();
}

