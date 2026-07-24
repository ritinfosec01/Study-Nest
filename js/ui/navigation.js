import {$} from '../utils.js';
import {buildCalendar} from '../features/calendar.js';
import {buildHabits} from '../features/habits.js';
import {buildMusicView} from '../features/music.js';
import {buildBgView} from '../features/background.js';
import {buildCustomize} from '../features/theme.js';

// ── VIEW ROUTER ──
const VIEWS = ['dashboard','calendar','habits','customize','music','background'];
export function showView(name){
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
