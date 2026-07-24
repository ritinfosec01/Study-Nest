import {loadState, saveState} from './storage.js';

export const state = loadState();

export function save(){
  saveState(state);
}
