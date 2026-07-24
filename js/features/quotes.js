import {escHtml, $} from '../utils.js';

// ── QUOTES ──
const quotes=[
  {text:"Never give up on a dream just because of the time it will take to accomplish it.",author:"Earl Nightingale"},
  {text:"The secret of getting ahead is getting started.",author:"Mark Twain"},
  {text:"It always seems impossible until it's done.",author:"Nelson Mandela"},
  {text:"Don't watch the clock; do what it does. Keep going.",author:"Sam Levenson"},
  {text:"You don't have to be great to start, but you have to start to be great.",author:"Zig Ziglar"},
  {text:"Push yourself, because no one else is going to do it for you.",author:"Unknown"},
  {text:"Little by little, a little becomes a lot.",author:"Tanzanian Proverb"},
  {text:"Success is the sum of small efforts, repeated day in and day out.",author:"Robert Collier"},
];
export function setQuote(){
  const q=quotes[Math.floor(Math.random()*quotes.length)];
  $('quoteText').innerHTML = `"${escHtml(q.text)}"<br><span style="font-size:.68rem;opacity:.65;font-style:normal">— ${escHtml(q.author)}</span>`;
}
