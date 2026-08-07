// ?debug=1 only. The console otherwise ships empty.
import { on } from './events.js';
import { P, mark } from './persist.js';
import { state as nervesState } from './nerves.js';
import { currentMovement } from './arc.js';
import { motifBank } from './touch.js';

export function mountDebug() {
  // QA hook — exists only under ?debug=1
  Promise.all([import('./events.js'), import('./language.js'), import('./play.js')]).then(([ev, lang, play]) => {
    window.__sorrel = { P, mark, currentMovement, nervesState, motifBank, emit: ev.emit, on: ev.on, lang, play };
  });
  const el = document.createElement('div');
  el.id = 'debug';
  el.style.cssText =
    'position:fixed;left:6px;bottom:6px;z-index:99;background:rgba(10,14,10,.9);color:#b8e0a0;font:10px ui-monospace,monospace;padding:8px;border-radius:8px;max-width:70vw;pointer-events:auto;white-space:pre-wrap';
  document.body.appendChild(el);
  const events = [];
  on('*', (t) => {
    if (t.startsWith('touch.') || t === 'nerves.state') return;
    events.push(t);
    if (events.length > 6) events.shift();
  });
  const btn = document.createElement('button');
  btn.textContent = 'RESET';
  btn.style.cssText = 'margin-top:4px;font:10px monospace';
  btn.onclick = () => {
    localStorage.removeItem('sorrel');
    location.reload();
  };
  setInterval(() => {
    const n = nervesState();
    el.textContent =
      `M${currentMovement()} ended=${P().ended} broken=${P().broken}/${P().repaired}\n` +
      `nerves a=${n.arousal.toFixed(2)} t=${n.trust.toFixed(2)} tn=${n.tension.toFixed(2)}\n` +
      `ratified=[${P().ratified}] gaps=[${P().gaps}]\n` +
      `motifs taps=${motifBank().taps.length} strokes=${motifBank().strokes.length}\n` +
      `recent: ${events.join(' ')}`;
    if (!el.contains(btn)) el.appendChild(btn);
  }, 600);
}
