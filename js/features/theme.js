import {state, save} from '../state.js';
import {$, pickTextColor} from '../utils.js';
import {showNotif} from '../ui/notifications.js';
import {applyTimerPreset} from './timer.js';

// ── CUSTOMIZE ──
const accentColors=[
  {name:'Amber',val:'#f5a623'},{name:'Purple',val:'#7c6af7'},{name:'Teal',val:'#2cb67d'},
  {name:'Rose',val:'#e05c8a'},{name:'Blue',val:'#4a90d9'},{name:'Green',val:'#4caf7d'},
];
export const timerPresets=[
  {label:'Classic',focus:25,short:5,long:15},
  {label:'Long',focus:50,short:10,long:30},
  {label:'Quick',focus:15,short:3,long:10},
  {label:'Deep',focus:90,short:20,long:45},
];

export function buildCustomize(){
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
export function applyAccent(val){
  const root = document.documentElement.style;
  root.setProperty('--accent', val);
  root.setProperty('--accent-text', pickTextColor(val));
}
export function setAccent(val){
  state.prefs.accent = val;
  applyAccent(val);
  save(); buildCustomize(); showNotif('Accent color updated!');
}
export function setPreset(i){
  state.prefs.preset = i;
  const p = timerPresets[i];
  applyTimerPreset(p);
  save(); buildCustomize();
  showNotif(`Timer set to ${p.label} preset!`);
}
export function toggleOpt(btn, key){
  btn.classList.toggle('on');
  state.prefs.opts[key] = btn.classList.contains('on');
  save();
  if(key==='quote') $('quoteText').style.opacity = state.prefs.opts.quote ? '1' : '0';
  if(key==='dim')   $('bgOverlay').style.opacity = state.prefs.opts.dim   ? '1' : '0.3';
}
