import {state, save} from '../state.js';
import {$} from '../utils.js';
import {showNotif} from '../ui/notifications.js';
import {addStudySession, addStudyTime, updateWeekStats} from './statistics.js';

// ── TIMER ──
export const timerModes={
  pomodoro:{secs:25*60,label:'Focus',break:false},
  short:{secs:5*60,label:'Short Break',break:true},
  long:{secs:15*60,label:'Long Break',break:true}
};
let curMode='pomodoro', secsLeft=25*60, totalSecs=25*60;
let running=false, interval=null, sessCount=0;

export function setMode(mode, tabEl){
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
export function toggleTimer(){ running ? pauseTimer() : startTimer(); }
export function startTimer(){
  running=true;
  $('startBtn').textContent='Pause';
  interval=setInterval(tick,1000);
}
export function pauseTimer(){
  running=false;
  $('startBtn').textContent='Resume';
  clearInterval(interval);
}
export function resetTimer(){
  pauseTimer();
  secsLeft=totalSecs;
  $('startBtn').textContent='Start';
  updateTimerDisplay();
}
export function skipMode(){
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
  if(curMode==='pomodoro'){
    addStudyTime(1/60);
    if(secsLeft % 15 === 0) save();
  }
  updateTimerDisplay();
  document.title=(running?'▶ ':'')+fmtTime(secsLeft)+' — StudyNest';
}
function onEnd(){
  clearInterval(interval); running=false;
  if(curMode==='pomodoro'){
    addStudySession();
    sessCount=(sessCount+1)%4;
    save();
    updateWeekStats();
    showNotif('🎉 Session complete!');
    switchAfterDelay(sessCount===0?'long':'short');
  } else {
    showNotif('☕ Break over — time to focus!');
    switchAfterDelay('pomodoro');
  }
  $('startBtn').textContent='Start';
  renderSessionDots();
}
function switchAfterDelay(mode){
  setTimeout(()=>{
    setMode(mode, null);
    if(state.prefs.opts.auto) startTimer();
  }, 800);
}
function fmtTime(s){return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
export function updateTimerDisplay(){$('timerDigits').textContent = fmtTime(secsLeft)}
export function renderSessionDots(){
  const wrap=$('sessionDots');
  wrap.innerHTML='';
  for(let i=0;i<4;i++){
    const d=document.createElement('div');
    d.className='sdot'+(i<sessCount?' done':i===sessCount?' current':'');
    wrap.appendChild(d);
  }
}

export function applyTimerPreset(preset){
  timerModes.pomodoro.secs = preset.focus*60;
  timerModes.short.secs = preset.short*60;
  timerModes.long.secs = preset.long*60;
  totalSecs = timerModes[curMode].secs;
  secsLeft = totalSecs;
  updateTimerDisplay();
}
