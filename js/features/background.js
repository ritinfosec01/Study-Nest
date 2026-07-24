import {state, save} from '../state.js';
import {escHtml, esc, $} from '../utils.js';
import {showNotif} from '../ui/notifications.js';

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

export async function loadCustomBgs(){
  try{
    const res = await fetch('assets/backgrounds/manifest.json', {cache:'no-cache'});
    if(!res.ok) return [];
    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.images || []);
    customBgs = items.map(entry=>{
      const file  = typeof entry === 'string' ? entry : entry.file;
      const label = typeof entry === 'string' ? entry.replace(/\.[^.]+$/, '') : (entry.label || file);
      return {
        id:'custom-' + file,
        label,
        css:`url('assets/backgrounds/${file}') center/cover no-repeat`,
      };
    });
    return customBgs;
  }catch(e){ return []; }
}

function allBgs(){
  return customBgs.length ? customBgs : bgOptions;
}

export function bgCssById(id){
  const all = [...customBgs, ...bgOptions, ...bgColors];
  return (all.find(b=>b.id===id) || bgOptions[1]).css;
}
export function buildBgView(){
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
export function setBg(id){
  state.prefs.bg = id;
  save();
  $('bgLayer').style.background = bgCssById(id);
  document.querySelectorAll('.bg-option,.bg-color-option').forEach(el=>el.classList.remove('selected'));
  const node = $('bg-'+id); if(node) node.classList.add('selected');
  showNotif('Background updated!');
}
