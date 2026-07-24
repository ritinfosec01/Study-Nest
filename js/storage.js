import {calcHabitStreak, ymd} from './utils.js';

const LS_KEY = 'studynest_v1';

export function defaultState(){
  return {
    tasks:[], deadlines:[], events:[],
    habits:[
      {id:1,name:'Morning run',icon:'🏃',streak:3,days:[1,1,1,0,0,0,0]},
      {id:2,name:'Read 30 mins',icon:'📖',streak:5,days:[1,1,1,1,1,0,0]},
      {id:3,name:'Meditate',icon:'🧘',streak:2,days:[0,1,1,0,0,0,0]},
    ],
    stats:{sessTotal:0, minTotal:0, daily:{}},
    prefs:{accent:'#f5a623', preset:0, bg:'night', opts:{quote:true,auto:false,dim:true}},
  };
}

export function loadState(){
  const fallback = defaultState();
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(raw) return normalizeState(JSON.parse(raw), fallback);
  }catch(e){}
  return fallback;
}

export function normalizeState(saved, fallback){
  const next = {...fallback, ...(saved || {})};
  next.tasks = Array.isArray(next.tasks) ? next.tasks : [];
  next.deadlines = Array.isArray(next.deadlines) ? next.deadlines : [];
  next.events = Array.isArray(next.events) ? next.events : [];
  next.habits = Array.isArray(next.habits) ? next.habits : fallback.habits;
  next.stats = {...fallback.stats, ...(saved && saved.stats ? saved.stats : {})};
  next.stats.daily = next.stats.daily && typeof next.stats.daily === 'object' ? next.stats.daily : {};
  if((next.stats.sessTotal || next.stats.minTotal) && !Object.keys(next.stats.daily).length){
    next.stats.daily[ymd(new Date())] = {
      sessions: Number(next.stats.sessTotal) || 0,
      minutes: Number(next.stats.minTotal) || 0,
    };
  }
  next.prefs = {...fallback.prefs, ...(saved && saved.prefs ? saved.prefs : {})};
  next.prefs.opts = {...fallback.prefs.opts, ...(next.prefs.opts || {})};
  next.habits.forEach(h=>{
    h.days = Array.isArray(h.days) ? h.days.slice(0,7) : [0,0,0,0,0,0,0];
    while(h.days.length < 7) h.days.push(0);
    h.streak = calcHabitStreak(h.days);
  });
  return next;
}

export function saveState(state){
  try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); }catch(e){}
}
