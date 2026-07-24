import {$} from '../utils.js';
import {showNotif} from '../ui/notifications.js';

// ── MUSIC (real mp3 files in /sounds) ──
let currentAudio = null, currentSoundId = null;
let globalVol = 0.4;
const musicDefs = [
  {id:'rain',    name:'Rain',         type:'Nature', emoji:'🌧️', cat:'Nature', file:'assets/sounds/rain.mp3'},
  {id:'thunder', name:'Thunderstorm', type:'Nature', emoji:'⛈️', cat:'Nature', file:'assets/sounds/thunder.mp3'},
  {id:'forest',  name:'Forest',       type:'Nature', emoji:'🌲', cat:'Nature', file:'assets/sounds/forest.mp3'},
  {id:'ocean',   name:'Ocean Waves',  type:'Nature', emoji:'🌊', cat:'Nature', file:'assets/sounds/ocean.mp3'},
  {id:'fire',    name:'Fireplace',    type:'Cozy',   emoji:'🔥', cat:'Cozy',   file:'assets/sounds/fire.mp3'},
  {id:'cafe',    name:'Coffee Shop',  type:'Cozy',   emoji:'☕', cat:'Cozy',   file:'assets/sounds/cafe.mp3'},
  {id:'wind',    name:'Gentle Wind',  type:'Nature', emoji:'💨', cat:'Nature', file:'assets/sounds/wind.mp3'},
  {id:'white',   name:'White Noise',  type:'Focus',  emoji:'🌫️', cat:'Focus',  file:'assets/sounds/white.mp3'},
];
const musicCats = ['All','Nature','Cozy','Focus'];
let activeCat='All', searchQ='';

export function setVol(v){
  globalVol = v/100;
  if(currentAudio) currentAudio.volume = globalVol;
}
export function stopMusic(){
  if(currentAudio){
    try{ currentAudio.pause(); currentAudio.src = ''; }catch(e){}
    currentAudio = null;
  }
  currentSoundId = null;
  $('nowPlayingBar').classList.remove('visible');
  document.querySelectorAll('.music-card').forEach(c=>c.classList.remove('playing'));
}
export function togglePlayback(){
  if(!currentAudio) return;
  if(currentAudio.paused){ currentAudio.play().catch(()=>{}); $('npPlayBtn').textContent = '||'; }
  else { currentAudio.pause(); $('npPlayBtn').textContent = '▶'; }
}
export function playSound(def){
  if(currentSoundId === def.id){ stopMusic(); return; }
  stopMusic();
  currentSoundId = def.id;
  const a = new Audio(def.file);
  a.loop = true;
  a.volume = globalVol;
  a.play().catch(err => {
    showNotif('Could not play ' + def.name);
    console.warn('audio play failed:', err);
  });
  currentAudio = a;
  $('npThumb').textContent = def.emoji;
  $('npName').textContent  = def.name;
  $('npType').textContent  = def.type;
  $('npPlayBtn').textContent = '||';
  $('nowPlayingBar').classList.add('visible');
  document.querySelectorAll('.music-card').forEach(c => c.classList.remove('playing'));
  const card = $('mc-' + def.id); if(card) card.classList.add('playing');
}
export function buildMusicView(){
  $('musicCats').innerHTML = musicCats.map(c=>`<button class="music-cat${c===activeCat?' active':''}" onclick="setCat('${c}')">${c}</button>`).join('');
  renderMusicGrid();
}
export function setCat(c){ activeCat=c; buildMusicView(); }
export function filterMusic(){ searchQ=$('musicSearch').value.toLowerCase(); renderMusicGrid(); }
export function renderMusicGrid(){
  const list = musicDefs.filter(d => (activeCat==='All'||d.cat===activeCat) && (d.name.toLowerCase().includes(searchQ)||d.type.toLowerCase().includes(searchQ)));
  $('musicGrid').innerHTML = list.map(d=>`
    <div class="music-card${currentSoundId===d.id?' playing':''}" id="mc-${d.id}" onclick='playSound(${JSON.stringify(d)})'>
      <div class="music-thumb">${d.emoji}</div>
      <div class="music-name">${d.name}</div>
      <div class="music-type">${d.type}</div>
    </div>`).join('');
}
