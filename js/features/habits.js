import {state, save} from '../state.js';
import {calcHabitStreak, escHtml, $} from '../utils.js';
import {showNotif} from '../ui/notifications.js';

// ── HABITS ──
const DAY_LABELS=['M','T','W','T','F','S','S'];

export function buildHabitMini(){
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
export function toggleHabitDay(id, dayIdx){
  const h = state.habits.find(x=>x.id===id);
  if(!h) return;
  h.days[dayIdx] = h.days[dayIdx] ? 0 : 1;
  h.streak = calcHabitStreak(h.days);
  save(); buildHabitMini(); buildHabits();
}
export function buildHabits(){
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
export function addHabit(){
  const name = prompt('Habit name?');
  if(!name || !name.trim()) return;
  const icons=['📚','💪','🏃','🧘','💧','🎸','✍️','🌿'];
  const icon = icons[Math.floor(Math.random()*icons.length)];
  state.habits.push({id:Date.now(), name:name.trim(), icon, streak:0, days:[0,0,0,0,0,0,0]});
  save(); buildHabits(); buildHabitMini(); showNotif('Habit added!');
}
export function deleteHabit(id){
  state.habits = state.habits.filter(h=>h.id!==id);
  save(); buildHabits(); buildHabitMini();
}
