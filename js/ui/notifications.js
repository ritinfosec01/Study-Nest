import {$} from '../utils.js';

let notifT;

export function showNotif(msg){
  const el = $('notif');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(notifT);
  notifT = setTimeout(()=>el.classList.remove('show'), 3000);
}
