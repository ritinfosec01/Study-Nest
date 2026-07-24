import {state, save} from '../state.js';
import {escHtml, $} from '../utils.js';
import {updateWeekStats} from './statistics.js';

// ── TASKS ──
export function addTask(){
  const inp = $('taskInp');
  const val = inp.value.trim();
  if(!val) return;
  state.tasks.push({id:Date.now(), text:val, done:false});
  inp.value=''; save(); renderTasks();
}
export function renderTasks(){
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
export function toggleTask(id){
  const t = state.tasks.find(x=>x.id===id);
  if(t){ t.done = !t.done; save(); renderTasks(); }
}
export function delTask(id){
  state.tasks = state.tasks.filter(x=>x.id!==id);
  save(); renderTasks();
}
export function toggleSection(key){
  const labelId = key==='ip' ? 'ipLabel' : 'doneLabel';
  const listId  = key==='ip' ? 'taskListIp' : 'taskListDone';
  const label = $(labelId);
  const list  = $(listId);
  if(!label || !list) return;
  label.classList.toggle('open');
  list.style.display = label.classList.contains('open') ? '' : 'none';
}
