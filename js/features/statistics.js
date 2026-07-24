import {state} from '../state.js';
import {$, parseYMD, ymd} from '../utils.js';

// ── WEEK STATS ──
let weekOffset=0;
function dailyStatsFor(dateStr){
  if(!state.stats.daily[dateStr]) state.stats.daily[dateStr] = {sessions:0, minutes:0};
  return state.stats.daily[dateStr];
}
export function addStudyTime(minutes){
  state.stats.minTotal = (Number(state.stats.minTotal) || 0) + minutes;
  dailyStatsFor(ymd(new Date())).minutes += minutes;
}
export function addStudySession(){
  state.stats.sessTotal = (Number(state.stats.sessTotal) || 0) + 1;
  dailyStatsFor(ymd(new Date())).sessions += 1;
}
function currentWeekRange(){
  const now=new Date(); now.setDate(now.getDate()+weekOffset*7);
  const mon=new Date(now); mon.setDate(now.getDate()-((now.getDay()+6)%7));
  const sun=new Date(mon); sun.setDate(mon.getDate()+6);
  return {mon, sun};
}
export function updateWeekStats(){
  const {mon, sun} = currentWeekRange();
  let sessions = 0;
  let minutes = 0;
  Object.entries(state.stats.daily || {}).forEach(([dateStr, vals])=>{
    const d = parseYMD(dateStr);
    if(d >= parseYMD(ymd(mon)) && d <= parseYMD(ymd(sun))){
      sessions += Number(vals.sessions) || 0;
      minutes += Number(vals.minutes) || 0;
    }
  });
  const tasksDoneCount = state.tasks.filter(t=>t.done).length;
  $('wSessions').textContent = Math.floor(sessions);
  $('wHrs').textContent = Math.floor(minutes/60);
  $('wMins').textContent = Math.floor(minutes%60);
  $('wTasks').textContent = tasksDoneCount;
  $('levelText').textContent = state.stats.sessTotal<5?'Novice':state.stats.sessTotal<15?'Student':state.stats.sessTotal<30?'Scholar':'Master';
}
export function changeWeek(d){ weekOffset+=d; buildWeekLabel(); updateWeekStats(); }
export function buildWeekLabel(){
  const {mon, sun} = currentWeekRange();
  const fmt=d=>d.toLocaleDateString('en-US',{month:'short',day:'numeric'}).toUpperCase();
  $('weekLabel').textContent = fmt(mon)+' – '+fmt(sun);
}
