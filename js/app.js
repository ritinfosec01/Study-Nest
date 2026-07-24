import {state} from './state.js';
import {$} from './utils.js';
import {setQuote} from './features/quotes.js';
import {buildWeekLabel, changeWeek, updateWeekStats} from './features/statistics.js';
import {applyTimerPreset, renderSessionDots, timerModes, toggleTimer, resetTimer, skipMode, setMode} from './features/timer.js';
import {buildHabitMini, buildHabits, toggleHabitDay, addHabit, deleteHabit} from './features/habits.js';
import {addTask, renderTasks, toggleTask, delTask, toggleSection} from './features/tasks.js';
import {openDlModal, closeDlModal, saveDeadline, renderDeadlines, delDl} from './features/deadlines.js';
import {openEvModal, openEvModalForEdit, closeEvModal, saveEvent, delEvent, selectEvColor, calNav, calToday, calCellClick, renderSchedule, buildCalendar} from './features/calendar.js';
import {playSound, stopMusic, togglePlayback, setVol, setCat, filterMusic} from './features/music.js';
import {loadCustomBgs, bgCssById, buildBgView, setBg} from './features/background.js';
import {timerPresets, applyAccent, buildCustomize, setAccent, setPreset, toggleOpt} from './features/theme.js';
import {setupModalDismiss, setupEscapeToClose} from './ui/modal.js';
import {showView} from './ui/navigation.js';

function init(){
  setQuote();
  buildWeekLabel();
  renderSessionDots();
  renderTasks();
  renderDeadlines();
  buildHabitMini();
  renderSchedule();

  const p = state.prefs;
  applyAccent(p.accent);
  $('bgLayer').style.background = bgCssById(p.bg);

  loadCustomBgs().then(list=>{
    window.StudyNest.customBgs = list;
    $('bgLayer').style.background = bgCssById(state.prefs.bg);
    if($('backgroundView').classList.contains('active')) buildBgView();
  });

  const tp = timerPresets[p.preset] || timerPresets[0];
  applyTimerPreset(tp);
  updateWeekStats();

  $('quoteToggle').classList.toggle('on', p.opts.quote);
  $('autoToggle').classList.toggle('on',  p.opts.auto);
  $('dimToggle').classList.toggle('on',   p.opts.dim);
  $('quoteText').style.opacity = p.opts.quote ? '1' : '0';
  $('bgOverlay').style.opacity = p.opts.dim   ? '1' : '0.3';

  setupModalDismiss('dlModal');
  setupModalDismiss('evModal');
  setupEscapeToClose();
}

Object.assign(window, {
  showView,
  setMode,
  toggleTimer,
  resetTimer,
  skipMode,
  changeWeek,
  toggleHabitDay,
  addHabit,
  deleteHabit,
  addTask,
  toggleTask,
  delTask,
  toggleSection,
  openDlModal,
  closeDlModal,
  saveDeadline,
  delDl,
  openEvModal,
  openEvModalForEdit,
  closeEvModal,
  saveEvent,
  delEvent,
  selectEvColor,
  calNav,
  calToday,
  calCellClick,
  playSound,
  stopMusic,
  togglePlayback,
  setVol,
  setCat,
  filterMusic,
  setBg,
  setAccent,
  setPreset,
  toggleOpt,
});

window.StudyNest = {state, timerModes, buildCalendar, buildBgView, buildCustomize};

document.addEventListener('DOMContentLoaded', init);
