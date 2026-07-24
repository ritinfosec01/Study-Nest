export function escHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

export function $(id){
  return document.getElementById(id);
}

export function ymd(date){
  const d = new Date(date);
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

export function parseYMD(s){
  const [y,m,d] = s.split('-').map(Number);
  return new Date(y, m-1, d);
}

export function clampInt(v,min,max,fallback){
  let n = parseInt(v,10);
  if(isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function calcHabitStreak(days){
  let streak = 0;
  for(let i=days.length-1; i>=0; i--){
    if(!days[i]) break;
    streak++;
  }
  return streak;
}

export function esc(s){
  return String(s).replace(/'/g, "\'");
}

export function pickTextColor(hex){
  const m = /^#?([a-f\d]{6})$/i.exec(hex.trim());
  if(!m) return '#111';
  const n = parseInt(m[1], 16);
  const r = (n>>16)&255, g = (n>>8)&255, b = n&255;
  const lum = (0.299*r + 0.587*g + 0.114*b) / 255;
  return lum > 0.62 ? '#111' : '#fff';
}
