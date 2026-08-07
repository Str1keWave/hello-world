import { state } from './state.js';
import { humanizeGap, clamp } from './util.js';
import { emit } from './bus.js';

// The voice: one element, one speaker, strictly rationed.
// Phase 0 never speaks. Phase 1 lines render as detached "system notes".
// Phase 2+ is the direct voice.

const MIN_GAP = 8000; // ms between lines
const QUEUE_CAP = 2;

let el = null;
let textEl = null;
let speaking = false;
let lastSpokeAt = 0;
let hideTimer = null;
let typeTimer = null;
const queue = [];

let reducedMotion = false;
try {
  reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
} catch {}

export function mountVoice() {
  el = document.createElement('div');
  el.id = 'voice';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.hidden = true;
  textEl = document.createElement('p');
  el.appendChild(textEl);
  document.body.appendChild(el);
  el.addEventListener('click', () => emit('tap.dialogue', { text: textEl.textContent }));
  return el;
}

export function renderTemplate(text, ev) {
  const d = new Date();
  return text
    .replace(/\{name\}/g, state.name || '')
    .replace(/\{visits\}/g, String(state.visits))
    .replace(/\{count\}/g, String(state.counters[ev?.type] || 0))
    .replace(/\{total\}/g, String(state.totals[ev?.type] || 0))
    .replace(/\{hour\}/g, String(d.getHours()))
    .replace(/\{gap\}/g, humanizeGap(state.gapMs))
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function speak(text, opts = {}) {
  if (!el || !text) return;
  if (state.phase === 0) {
    // The Mask does not speak. Chosen silence, tracked.
    state.silences += 1;
    return;
  }
  const item = { text, mood: opts.mood || 'calm', priority: opts.priority ?? 10, ruleId: opts.ruleId };
  const since = Date.now() - lastSpokeAt;
  if (speaking || since < MIN_GAP) {
    queue.push(item);
    queue.sort((a, b) => b.priority - a.priority);
    while (queue.length > QUEUE_CAP) queue.pop(); // drop lowest priority
    scheduleDrain();
    return;
  }
  present(item);
}

let drainTimer = null;
function scheduleDrain() {
  if (drainTimer) return;
  const wait = Math.max(300, MIN_GAP - (Date.now() - lastSpokeAt));
  drainTimer = setTimeout(() => {
    drainTimer = null;
    if (!speaking && queue.length) present(queue.shift());
    else if (queue.length) scheduleDrain();
  }, wait);
}

function present(item) {
  speaking = true;
  lastSpokeAt = Date.now();
  clearTimeout(hideTimer);
  clearInterval(typeTimer);

  el.hidden = false;
  el.className = `mood-${item.mood} phase-${state.phase}`;
  // force restart of entrance transition
  el.classList.remove('shown');
  void el.offsetWidth;
  el.classList.add('shown');

  if (reducedMotion || state.phase === 1) {
    textEl.textContent = item.text;
    afterTyped(item);
  } else {
    textEl.textContent = '';
    let i = 0;
    typeTimer = setInterval(() => {
      i += 1;
      textEl.textContent = item.text.slice(0, i);
      if (i >= item.text.length) {
        clearInterval(typeTimer);
        afterTyped(item);
      }
    }, 24);
  }
}

function afterTyped(item) {
  const readMs = clamp(2600 + item.text.length * 60, 3500, 14000);
  hideTimer = setTimeout(() => {
    el.classList.remove('shown');
    speaking = false;
    if (queue.length) scheduleDrain();
    setTimeout(() => {
      if (!speaking && !el.classList.contains('shown')) el.hidden = true;
    }, 600);
  }, readMs);
}

// Let story beats clear the floor.
export function silenceAll() {
  queue.length = 0;
  clearTimeout(hideTimer);
  clearInterval(typeTimer);
  if (el) {
    el.classList.remove('shown');
    el.hidden = true;
  }
  speaking = false;
}
