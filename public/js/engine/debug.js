import { state, saveNow } from './state.js';
import { recentEvents } from './bus.js';
import { ruleStats, coverage } from './resolver.js';
import { advancePhase, evaluateEnding } from './phases.js';

// Debug overlay. Toggle: tap the footer's © line 5 times fast, or ?debug=1.
let el = null;
let timer = null;

export function mountDebug() {
  const params = new URLSearchParams(location.search);
  if (params.has('debug')) toggle(true);

  const trigger = document.getElementById('footer-copyright');
  if (trigger) {
    let taps = [];
    trigger.addEventListener('click', () => {
      const t = Date.now();
      taps = taps.filter((x) => t - x < 2200);
      taps.push(t);
      if (taps.length >= 5) {
        taps = [];
        toggle();
      }
    });
  }
}

function toggle(force) {
  const show = force ?? !el;
  if (!show) {
    clearInterval(timer);
    el?.remove();
    el = null;
    state.flags.debug = false;
    return;
  }
  state.flags.debug = true;
  el = document.createElement('div');
  el.id = 'debug-overlay';
  el.innerHTML = `
    <div class="dbg-head">loam://debug <button data-a="close">×</button></div>
    <pre class="dbg-body"></pre>
    <div class="dbg-actions">
      <button data-a="phase">phase+</button>
      <button data-a="coverage">coverage→console</button>
      <button data-a="reset">RESET ALL</button>
    </div>
    <div class="dbg-endings">endings: cruel=hostility·6+ · kind=kindness·5+ · completionist=dig everywhere (404s, devtools, artifacts) · indifferent=default/skim</div>`;
  document.body.appendChild(el);
  el.addEventListener('click', (e) => {
    const a = e.target?.dataset?.a;
    if (a === 'close') toggle(false);
    if (a === 'phase') advancePhase(state.phase + 1);
    if (a === 'coverage') {
      console.table(coverage());
      console.log('[loam] rule stats', ruleStats());
    }
    if (a === 'reset') {
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(';').forEach((c) => {
        document.cookie = c.split('=')[0].trim() + '=; max-age=0; path=/';
      });
      indexedDB.deleteDatabase('loam-log');
      location.reload();
    }
    e.stopPropagation();
  });
  timer = setInterval(render, 800);
  render();
}

function render() {
  if (!el) return;
  const rs = ruleStats();
  const evs = recentEvents(9)
    .map((e) => `${new Date(e.t).toLocaleTimeString()} ${e.type}${e.data && Object.keys(e.data).length ? ' ' + JSON.stringify(e.data).slice(0, 60) : ''}`)
    .join('\n');
  el.querySelector('.dbg-body').textContent =
    `phase=${state.phase} score=${state.actionScore} visits=${state.visits} reloads=${state.reloads}\n` +
    `name=${state.name} ending=${state.ending} → would earn: ${evaluateEnding()}\n` +
    `disp=${JSON.stringify(state.disposition)}\n` +
    `rules=${rs.total} lastFired=${rs.lastResolved ? `${rs.lastResolved.ev} → ${rs.lastResolved.rule}` : '—'}\n` +
    `silences=${state.silences}\n— recent events —\n${evs}`;
  saveNow();
}
