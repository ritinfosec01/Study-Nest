import {$} from '../utils.js';

export function setupModalDismiss(id){
  const el = $(id);
  el.addEventListener('click', e => { if(e.target === el) el.classList.remove('open'); });
}

export function setupEscapeToClose(){
  document.addEventListener('keydown', e=>{
    if(e.key==='Escape'){
      $('dlModal').classList.remove('open');
      $('evModal').classList.remove('open');
    }
  });
}
