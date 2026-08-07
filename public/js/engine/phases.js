import { state, save } from './state.js';
import { emit, on } from './bus.js';

// Phase advancement is driven by accumulated action, not time.
// 0 Mask -> 1 Slippage -> 2 Contact -> 3 Truth -> 4 Ending

const THRESHOLDS = { 1: 14, 2: 44, 3: 110 }; // actionScore needed to auto-advance

// Events that signal engagement more strongly than a scroll tick
const WEIGHTS = {
  'tap': 1,
  'tap.dead': 1,
  'tap.rage': 3,
  'tap.logo': 2,
  'press.long': 2,
  'drag.futile': 2,
  'scroll.bottom': 3,
  'scroll.reverse': 2,
  'scroll.stall': 2,
  'text.select': 3,
  'text.copy': 4,
  'input.focus': 2,
  'input.submit.name': 8,
  'input.submit.empty': 4,
  'input.deleted': 3,
  'tab.show': 2,
  'nav.back': 3,
  'page.reload': 3,
  'devtools.open': 6,
  'page.404': 4,
  'menu.context': 2,
  'select.all': 3,
};

on('*', (ev) => {
  if (ev.type.startsWith('phase.') || ev.type.startsWith('env.')) return;
  state.actionScore += WEIGHTS[ev.type] ?? 1;
  const next = state.phase + 1;
  if (next <= 3 && THRESHOLDS[next] && state.actionScore >= THRESHOLDS[next]) {
    advancePhase(next);
  }
});

export function advancePhase(n) {
  if (n <= state.phase) return;
  if (n > state.phase + 1) n = state.phase + 1; // never skip acts
  if (state.phase === 4) return;
  state.phase = n;
  save();
  applyPhaseClass();
  emit('phase.enter', { phase: n });
}

export function applyPhaseClass() {
  const b = document.body;
  b.className = b.className.replace(/\bphase-\d\b/g, '').trim();
  b.classList.add(`phase-${state.phase}`);
}

// Personality read -> which ending this visitor has earned.
export function evaluateEnding() {
  const d = state.disposition;
  const dug = d.curiosity + (state.totals['page.404'] || 0) + (state.totals['devtools.open'] ? 4 : 0);
  if (dug >= 12 && d.cruelty <= d.kindness + 4) return 'completionist';
  if (d.cruelty >= 6 && d.cruelty > d.kindness) return 'cruel';
  if (d.kindness >= 5 && d.kindness >= d.cruelty) return 'kind';
  return 'indifferent';
}
