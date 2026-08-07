// /app — the working product under the landing page. Pre-gate: a login
// wall. Post-gate: the dashboard simply opens — the device was always the
// credential. Every figure rendered here is literally true and derivable
// from local memory. L7 grammar throughout: third person, the subject is
// an object, no commentary, no reaction to being read.
// The one permitted v1 echo lives in the landscape sessions row.
import { s, save, gateLevel } from './state.js';
import { T } from './tunables.js';
import { queryLog, logEvent } from '../engine/memory.js';

const CH_NAME = 'loam-app';
// Same-document guard: the dashboard opens as an overlay on the landing
// page, so its channel and the landing broadcaster can share a document.
// Messages carry a per-tab id; the dashboard ignores its own tab.
const TAB_ID = Math.random().toString(36).slice(2) + Date.now().toString(36);

const SECTIONS = [
  ['hero', 'hero', 14],
  ['features', 'features', 22],
  ['how', 'how it works', 16],
  ['testimonials', 'testimonials', 18],
  ['pricing', 'pricing', 20],
  ['signup', 'signup', 10],
];

// captured at render time so the echo row normalizes on the NEXT open,
// not the one during which it was first revealed
let echoNormalized = false;

// ---------------------------------------------------------------------
// helpers

function esc(x) {
  return String(x == null ? '' : x).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

function dayKey(t) {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function startOfDay(t) {
  const d = new Date(t);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function fmtDate(t) {
  try {
    return new Date(t).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function fmtDay(t) {
  try {
    return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function hm(t) {
  const d = new Date(t);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function hms(t) {
  const d = new Date(t);
  return `${hm(t)}:${String(d.getSeconds()).padStart(2, '0')}`;
}

// honest UA abbreviation: browser + OS only
function deviceLabel() {
  const ua = navigator.userAgent || '';
  let b = 'browser';
  if (/Edg\//.test(ua)) b = 'Edge';
  else if (/OPR\/|Opera/.test(ua)) b = 'Opera';
  else if (/Firefox\//.test(ua)) b = 'Firefox';
  else if (/Chrome\/|CriOS\//.test(ua)) b = 'Chrome';
  else if (/Safari\//.test(ua)) b = 'Safari';
  let os = '';
  if (/Windows/.test(ua)) os = 'Windows';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
  else if (/Mac OS X|Macintosh/.test(ua)) os = 'macOS';
  else if (/CrOS/.test(ua)) os = 'ChromeOS';
  else if (/Linux/.test(ua)) os = 'Linux';
  return os ? `${b} · ${os}` : b;
}

// ---------------------------------------------------------------------
// styles (scoped: .lapp-)

const STYLE = `<style>
  .lapp { font-size: .95rem; }
  .lapp-head { display: flex; align-items: baseline; justify-content: space-between;
    gap: 10px; flex-wrap: wrap; margin-bottom: 18px; }
  .lapp-ws { font-weight: 700; font-size: 1.15rem; }
  .lapp-tag { display: inline-block; margin-left: 8px; padding: 1px 7px; border: 1px solid var(--line);
    border-radius: 999px; font-size: .68rem; color: var(--muted); vertical-align: 2px; }
  .lapp-subj { color: var(--muted); font-size: .85rem; display: flex; align-items: center; gap: 7px; }
  .lapp-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent);
    display: inline-block; }
  .lapp-card { background: var(--card); border: 1px solid var(--line); border-radius: 12px;
    padding: 14px 16px; margin-bottom: 14px; }
  .lapp-card h2 { font-size: .82rem; text-transform: uppercase; letter-spacing: .06em;
    color: var(--muted); margin: 0 0 10px; font-weight: 600; }
  .lapp-kv { display: flex; justify-content: space-between; gap: 12px; padding: 6px 0;
    border-bottom: 1px solid var(--line); }
  .lapp-kv:last-of-type { border-bottom: 0; }
  .lapp-kv span { color: var(--muted); }
  .lapp-kv b { font-weight: 600; font-variant-numeric: tabular-nums; text-align: right; }
  .lapp-num { font-variant-numeric: tabular-nums; }
  .lapp-muted { color: var(--muted); font-size: .8rem; }
  .lapp-sparkwrap { padding-top: 8px; }
  .lapp-spark { display: block; margin-top: 6px; }
  .lapp-spark polyline { stroke: var(--accent); }

  .lapp-ticker { margin-top: 12px; border-top: 1px solid var(--line); padding-top: 8px; }
  .lapp-ticker-rows { max-height: 130px; overflow-y: auto; font-family: ui-monospace, SFMono-Regular, monospace;
    font-size: .74rem; color: var(--muted); margin-top: 4px; }
  .lapp-ticker-rows p { margin: 0 0 3px; }

  .lapp-map { display: flex; gap: 14px; align-items: stretch; }
  .lapp-thumb { position: relative; width: 64px; min-height: 220px; border: 1px solid var(--line);
    border-radius: 6px; overflow: hidden; flex: none; display: flex; flex-direction: column; }
  .lapp-sec { border-bottom: 1px solid var(--line); }
  .lapp-sec:last-child { border-bottom: 0; }
  .lapp-vp { position: absolute; left: 2px; right: 2px; height: 26px; border: 1.5px solid var(--accent);
    border-radius: 3px; top: 0; transition: top .25s linear; pointer-events: none; display: none; }
  .lapp-vp.on { display: block; }
  .lapp-map-legend { flex: 1; }
  .lapp-map-legend div { display: flex; justify-content: space-between; padding: 4px 0;
    font-size: .8rem; color: var(--muted); border-bottom: 1px solid var(--line); }
  .lapp-map-legend div:last-child { border-bottom: 0; }
  .lapp-map-legend b { color: var(--ink); font-weight: 500; font-variant-numeric: tabular-nums; }

  .lapp-twrap { overflow-x: auto; }
  .lapp-table { width: 100%; border-collapse: collapse; font-size: .82rem; }
  .lapp-table th { text-align: left; color: var(--muted); font-weight: 600; font-size: .72rem;
    text-transform: uppercase; letter-spacing: .05em; padding: 6px 8px 6px 0; border-bottom: 1px solid var(--line); }
  .lapp-table td { padding: 7px 8px 7px 0; border-bottom: 1px solid var(--line);
    font-variant-numeric: tabular-nums; white-space: nowrap; }
  .lapp-row { cursor: pointer; }
  .lapp-lx { display: none; }
  .lapp-ghost { display: none; }
  .lapp-detail td { white-space: normal; }
  .lapp-stream { max-height: 180px; overflow-y: auto; font-family: ui-monospace, SFMono-Regular, monospace;
    font-size: .72rem; color: var(--muted); line-height: 1.7; }
  @media (orientation: landscape) {
    .lapp-lx { display: table-cell; }
    tr.lapp-ghost { display: table-row; }
    .lapp-colnote { display: none; }
  }

  .lapp-frag { font-family: ui-monospace, SFMono-Regular, monospace; letter-spacing: 1px; }
  .lapp-pill { display: inline-block; padding: 1px 7px; border: 1px solid var(--line);
    border-radius: 999px; font-size: .68rem; color: var(--muted); }

  .lapp-set { display: flex; justify-content: space-between; align-items: center; gap: 12px;
    padding: 8px 0; border-bottom: 1px solid var(--line); }
  .lapp-set:last-child { border-bottom: 0; }
  .lapp-set label { color: var(--ink); }
  .lapp-set .lapp-muted { display: block; margin-top: 2px; }
  .lapp-set input[type="checkbox"] { width: 18px; height: 18px; accent-color: var(--accent); flex: none; }

  .lapp-login { max-width: 340px; margin: 8vh auto 0; }
  .lapp-login h1 { font-size: 1.3rem; margin-bottom: 4px; }
  .lapp-login .lapp-muted { margin-bottom: 18px; }
  .lapp-login label { display: block; font-size: .8rem; color: var(--muted); margin-bottom: 6px; }
  .lapp-login input[type="email"] { width: 100%; padding: 10px 12px; border: 1px solid var(--line);
    border-radius: 8px; background: var(--card); color: var(--ink); font-size: .95rem; margin-bottom: 12px; }
  .lapp-login button { width: 100%; padding: 10px 12px; border: 0; border-radius: 8px;
    background: var(--accent); color: var(--accent-ink); font-size: .95rem; cursor: pointer; }
  .lapp-login .lapp-forgot { display: inline-block; margin-top: 12px; font-size: .82rem;
    color: var(--muted); text-decoration: underline; }
  .lapp-login .lapp-forgot-note { margin-top: 10px; }
  @keyframes lapp-shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-6px); }
    75% { transform: translateX(6px); }
  }
  .lapp-shake { animation: lapp-shake .35s ease; }
</style>`;

// ---------------------------------------------------------------------
// renderApp

export function renderApp() {
  if (s.ended || s.masked) return renderLogin();
  if (gateLevel() < T.gates.appGate) return renderLogin();
  echoNormalized = !!s.appEcho;
  return renderDashboard();
}

function renderLogin() {
  return `${STYLE}
  <div class="lapp lapp-login">
    <h1>loam.dev<span class="lapp-tag">beta</span></h1>
    <p class="lapp-muted">Sign in to the workspace.</p>
    <form class="lapp-login-form" novalidate>
      <label for="lapp-email">Work email</label>
      <input id="lapp-email" type="email" autocomplete="off" spellcheck="false">
      <button type="submit">Sign in</button>
    </form>
    <a href="#" class="lapp-forgot">Forgot?</a>
    <p class="lapp-muted lapp-forgot-note" hidden>Credential resets are handled by the account owner.</p>
    <a href="/" class="btn btn-ghost back-home" data-close-space>← Back</a>
  </div>`;
}

function renderDashboard() {
  const sessions30 = (s.visits || 0) + (s.profile?.visits || 0);
  const firstSeen = s.profile?.firstSeen || s.firstSeen || 0;
  const style = s.investigation?.everStreak ? 'thorough, skeptical' : 'steady, quiet';
  const retention = s.retention || 'unlimited (beta)';

  const thumb = SECTIONS.map(
    ([id, , h]) => `<div class="lapp-sec" data-sec="${id}" style="flex:${h} 0 0"></div>`
  ).join('');

  const frags = (s.deletedText || [])
    .map((f) => `<span class="lapp-frag">${'·'.repeat(Math.max(4, Math.min(14, (f || '').length)))}</span>`)
    .join(' ');

  return `${STYLE}
  <div class="lapp">
    <div class="lapp-head">
      <div><span class="lapp-ws">loam.dev</span><span class="lapp-tag">beta</span></div>
      <div class="lapp-subj">Subjects: 1 <span class="lapp-dot" hidden></span></div>
    </div>

    <div class="lapp-card">
      <h2>Site overview</h2>
      <div class="lapp-kv"><span>Tracked sites</span><b>1 · ${esc(location.host || 'this site')}</b></div>
      <div class="lapp-kv"><span>Sessions (30d)</span><b>${sessions30}</b></div>
      <div class="lapp-sparkwrap"><span class="lapp-muted">Sessions per day</span>
        <div class="lapp-spark-slot"><span class="lapp-muted">…</span></div>
      </div>
      <div class="lapp-ticker" hidden>
        <span class="lapp-muted">Live</span>
        <div class="lapp-ticker-rows"></div>
      </div>
    </div>

    <div class="lapp-card">
      <h2>Subject 0001</h2>
      <div class="lapp-kv"><span>First observed</span><b>${firstSeen ? esc(fmtDate(firstSeen)) : '—'}</b></div>
      <div class="lapp-kv"><span>Device</span><b>${esc(deviceLabel())}</b></div>
      <div class="lapp-kv"><span>Engagement style</span><b>${style}</b></div>
    </div>

    <div class="lapp-card">
      <h2>Attention map</h2>
      <div class="lapp-map">
        <div class="lapp-thumb">${thumb}<div class="lapp-vp"></div></div>
        <div class="lapp-map-legend">
          ${SECTIONS.map(([id, label]) => `<div><span>${esc(label)}</span><b data-secv="${id}">—</b></div>`).join('')}
        </div>
      </div>
      <p class="lapp-muted lapp-map-note" style="margin-top:8px">…</p>
    </div>

    <div class="lapp-card">
      <h2>Sessions</h2>
      <p class="lapp-muted lapp-sess-count">…</p>
      <div class="lapp-twrap">
        <table class="lapp-table">
          <thead><tr>
            <th>Date</th><th class="lapp-lx">Start</th><th>Events</th><th>Top event</th>
            <th>Duration</th><th class="lapp-lx">Device</th><th class="lapp-lx">Status</th>
          </tr></thead>
          <tbody class="lapp-tbody"><tr><td colspan="7" class="lapp-muted">…</td></tr></tbody>
        </table>
      </div>
      <p class="lapp-muted lapp-colnote">4 of 7 columns</p>
    </div>

    <div class="lapp-card">
      <h2>Form analytics</h2>
      <div class="lapp-kv"><span>Field “name”</span><b class="lapp-formline">…</b></div>
      <div class="lapp-kv"><span>Deleted text</span><b>${(s.deletedText || []).length} fragments retained</b></div>
      <p style="margin-top:8px">${frags ? `${frags} ` : ''}<span class="lapp-pill">PII masking: on</span></p>
    </div>

    <div class="lapp-card">
      <h2>Settings</h2>
      <div class="lapp-set">
        <div><label for="lapp-pii">PII masking</label>
          <span class="lapp-muted">Masking is enforced at the retention layer.</span></div>
        <input id="lapp-pii" type="checkbox" checked>
      </div>
      <div class="lapp-set">
        <div><label for="lapp-replay">Session replay</label>
          <span class="lapp-muted">beta</span></div>
        <input id="lapp-replay" type="checkbox" disabled>
      </div>
      <div class="lapp-set">
        <div><label>Retention window</label>
          <span class="lapp-muted">Applies to account #0001.</span></div>
        <b class="lapp-num">${esc(retention)}</b>
      </div>
    </div>

    <a href="/" class="btn btn-ghost back-home" data-close-space>← Back</a>
  </div>`;
}

// ---------------------------------------------------------------------
// hydrateApp — fills async data after the space renders

export function hydrateApp(spaceEl) {
  const root = spaceEl.querySelector('.lapp');
  if (!root) return;

  if (root.classList.contains('lapp-login')) {
    hydrateLogin(root);
    return;
  }

  if (!s.appSeen) {
    s.appSeen = true;
    save();
  }

  hydrateSettings(root);
  mountOrientationEcho(root);
  openDashChannel(root);
  fillData(root).catch(() => {});
}

function hydrateLogin(root) {
  const form = root.querySelector('.lapp-login-form');
  const input = root.querySelector('#lapp-email');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    form.classList.remove('lapp-shake');
    void form.offsetWidth; // restart the animation
    form.classList.add('lapp-shake');
    setTimeout(() => {
      if (input) input.value = '';
    }, 380);
  });
  const forgot = root.querySelector('.lapp-forgot');
  forgot?.addEventListener('click', (e) => {
    e.preventDefault();
    const note = root.querySelector('.lapp-forgot-note');
    if (note) note.hidden = false;
  });
}

function hydrateSettings(root) {
  const pii = root.querySelector('#lapp-pii');
  pii?.addEventListener('change', () => {
    if (!pii.checked) setTimeout(() => (pii.checked = true), 1000);
  });
}

// the one permitted v1 echo: a landscape reveal marks the flag; the row
// normalizes on the next open
function mountOrientationEcho(root) {
  let mq = null;
  try {
    mq = matchMedia('(orientation: landscape)');
  } catch {
    return;
  }
  const mark = () => {
    if (!mq.matches || s.appEcho) return;
    if (!root.querySelector('.lapp-ghost')) return; // no row rendered, nothing revealed
    s.appEcho = 1;
    save();
  };
  if (mq.addEventListener) mq.addEventListener('change', mark);
  else if (mq.addListener) mq.addListener(mark);
  // the ghost row is injected async; re-check once the data lands
  root.addEventListener('lapp:data', mark);
  mark();
}

// ---------------------------------------------------------------------
// data derivation (IndexedDB, honest only)

async function fillData(root) {
  const evs = await queryLog(null, 500);
  if (!document.body.contains(root)) return;
  evs.sort((a, b) => (a.t || 0) - (b.t || 0)); // queryLog returns newest-first

  const buckets = bucketByDay(evs);
  fillSparkline(root, evs);
  fillAttentionMap(root, evs);
  fillSessions(root, buckets);
  fillFormLine(root, evs);
  root.dispatchEvent(new CustomEvent('lapp:data'));
}

function bucketByDay(evs) {
  const map = new Map();
  for (const e of evs) {
    if (!e.t) continue;
    const k = dayKey(e.t);
    let b = map.get(k);
    if (!b) {
      b = { key: k, ts: [], types: new Map(), events: [] };
      map.set(k, b);
    }
    b.ts.push(e.t);
    b.types.set(e.type, (b.types.get(e.type) || 0) + 1);
    b.events.push(e);
  }
  return [...map.values()].sort((a, b) => a.ts[0] - b.ts[0]);
}

function fillSparkline(root, evs) {
  const slot = root.querySelector('.lapp-spark-slot');
  if (!slot) return;
  // sessions per day over the last 30 days: clusters of events separated
  // by more than 30 minutes count as separate sessions
  const now = Date.now();
  const counts = new Array(30).fill(0);
  let lastT = 0;
  for (const e of evs) {
    if (!e.t) continue;
    const age = Math.round((startOfDay(now) - startOfDay(e.t)) / 86400000);
    if (age < 0 || age > 29) continue;
    if (e.t - lastT > 30 * 60 * 1000) counts[29 - age] += 1;
    lastT = e.t;
  }
  const w = 220;
  const h = 32;
  const max = Math.max(1, ...counts);
  const pts = counts
    .map((c, i) => `${((i / (counts.length - 1)) * (w - 4) + 2).toFixed(1)},${(h - 3 - (c / max) * (h - 8)).toFixed(1)}`)
    .join(' ');
  slot.innerHTML = `<svg class="lapp-spark" viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke-width="1.5"/></svg>`;
}

function fillAttentionMap(root, evs) {
  // dwell proxy: scroll.stall carries {section}; fallback: text.select sections
  const counts = {};
  let total = 0;
  for (const e of evs) {
    if (e.type === 'scroll.stall' && e.data?.section) {
      counts[e.data.section] = (counts[e.data.section] || 0) + 1;
      total += 1;
    }
  }
  if (!total) {
    for (const e of evs) {
      if (e.type === 'text.select' && e.data?.section) {
        counts[e.data.section] = (counts[e.data.section] || 0) + 1;
        total += 1;
      }
    }
  }
  const note = root.querySelector('.lapp-map-note');
  if (!total) {
    if (note) note.textContent = 'insufficient data';
    return;
  }
  if (note) note.textContent = 'Dwell events by section, all sessions.';
  const max = Math.max(...SECTIONS.map(([id]) => counts[id] || 0), 1);
  for (const [id] of SECTIONS) {
    const c = counts[id] || 0;
    const cell = root.querySelector(`.lapp-sec[data-sec="${id}"]`);
    if (cell && c) cell.style.background = `rgba(76, 92, 67, ${(0.08 + 0.42 * (c / max)).toFixed(2)})`;
    const v = root.querySelector(`[data-secv="${id}"]`);
    if (v) v.textContent = c ? String(c) : '—';
  }
}

function fillSessions(root, buckets) {
  const tbody = root.querySelector('.lapp-tbody');
  const countEl = root.querySelector('.lapp-sess-count');
  if (!tbody) return;
  if (!buckets.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="lapp-muted">insufficient data</td></tr>`;
    if (countEl) countEl.textContent = '0 sessions on record.';
    return;
  }

  const dev = deviceLabel();
  const rows = buckets.map((b) => {
    const first = b.ts[0];
    const last = b.ts[b.ts.length - 1];
    const dur = Math.max(1, Math.round((last - first) / 60000));
    let top = '';
    let topN = 0;
    for (const [ty, n] of b.types) {
      if (n > topN) {
        top = ty;
        topN = n;
      }
    }
    return {
      t: first,
      html: `<tr class="lapp-row" data-day="${esc(b.key)}">
        <td>${esc(fmtDay(first))}</td>
        <td class="lapp-lx">${hm(first)}</td>
        <td>${b.ts.length}</td>
        <td>${esc(top)}</td>
        <td>${dur}m</td>
        <td class="lapp-lx">${esc(dev)}</td>
        <td class="lapp-lx">settled</td>
      </tr>
      <tr class="lapp-detail" data-detail="${esc(b.key)}" hidden>
        <td colspan="7"><div class="lapp-stream">${b.events
          .slice(-60)
          .map((e) => `${hms(e.t)} · ${esc(e.type)}`)
          .join('<br>')}</div></td>
      </tr>`,
    };
  });

  // the session that shouldn't exist: dated between two real days
  const ghostT = ghostTimestamp(buckets);
  if (ghostT != null) {
    rows.push({
      t: ghostT,
      html: `<tr class="lapp-ghost">
        <td>${esc(fmtDay(ghostT))}</td>
        <td class="lapp-lx">${hm(ghostT)}</td>
        <td>—</td>
        <td>—</td>
        <td>41m</td>
        <td class="lapp-lx">${echoNormalized ? 'Linux · headless' : ''}</td>
        <td class="lapp-lx">${echoNormalized ? 'classified: bot' : 'reviewed'}</td>
      </tr>`,
    });
  }

  rows.sort((a, b) => a.t - b.t);
  tbody.innerHTML = rows.map((r) => r.html).join('');

  // portrait shows only the total — off by one for anyone who counts
  const n = buckets.length + (ghostT != null ? 1 : 0);
  if (countEl) countEl.textContent = `${n} session${n === 1 ? '' : 's'} on record.`;

  tbody.querySelectorAll('.lapp-row').forEach((tr) =>
    tr.addEventListener('click', () => {
      const d = tbody.querySelector(`[data-detail="${CSS.escape(tr.dataset.day)}"]`);
      if (d) d.hidden = !d.hidden;
    })
  );
}

function ghostTimestamp(buckets) {
  if (buckets.length < 2) return null;
  // prefer a calendar day strictly between two real days
  for (let i = 0; i < buckets.length - 1; i++) {
    const a = startOfDay(buckets[i].ts[0]);
    const b = startOfDay(buckets[i + 1].ts[0]);
    if (b - a >= 2 * 86400000) return a + 86400000 + (3 * 3600 + 12 * 60) * 1000; // 03:12, the day after
  }
  // adjacent days only: the midpoint between the last event of one day and
  // the first of the next — an hour no session used
  const A = buckets[buckets.length - 2];
  const B = buckets[buckets.length - 1];
  return Math.round((A.ts[A.ts.length - 1] + B.ts[0]) / 2);
}

function fillFormLine(root, evs) {
  const el = root.querySelector('.lapp-formline');
  if (!el) return;
  let focus = 0;
  let submits = 0;
  for (const e of evs) {
    if (e.type === 'input.focus' && (!e.data?.field || e.data.field === 'field-name')) focus += 1;
    else if (e.type === 'input.submit' || e.type === 'input.submit.name' || e.type === 'input.submit.empty') submits += 1;
  }
  if (!focus && !submits) {
    el.textContent = 'no captures';
    return;
  }
  const abandoned = Math.max(0, focus - submits);
  el.textContent = `focused ${focus}×, abandoned ${abandoned}×`;
}

// ---------------------------------------------------------------------
// dashboard side of the BroadcastChannel

let dashCleanup = null;

function openDashChannel(root) {
  if (typeof BroadcastChannel === 'undefined') return;
  if (dashCleanup) dashCleanup();

  let ch;
  try {
    ch = new BroadcastChannel(CH_NAME);
  } catch {
    return;
  }

  const dot = root.querySelector('.lapp-dot');
  const ticker = root.querySelector('.lapp-ticker');
  const tickerRows = root.querySelector('.lapp-ticker-rows');
  const vp = root.querySelector('.lapp-vp');
  const thumb = root.querySelector('.lapp-thumb');

  let lastForeign = 0;
  let buffer = []; // events received while the document was hidden

  const post = (m) => {
    try {
      ch.postMessage(Object.assign({ tab: TAB_ID, t: Date.now() }, m));
    } catch {}
  };

  const markTwoTab = () => {
    if (!s.twoTabSeen) {
      s.twoTabSeen = true;
      save();
      logEvent('twotab', {}, Date.now());
    }
  };

  const moveVp = (p) => {
    if (!vp || !thumb) return;
    vp.classList.add('on');
    const range = Math.max(0, thumb.clientHeight - vp.offsetHeight - 4);
    vp.style.top = `${2 + range * Math.max(0, Math.min(1, p))}px`;
  };

  const label = (m) => {
    if (m.type === 'idle') return `idle ${m.s || 12}s`;
    if (m.type === 'tap') return m.k ? `tap · ${m.k}` : 'tap';
    if (m.type === 'scroll.reverse') return 'scroll · reverse';
    return m.type;
  };

  const renderEvent = (m) => {
    markTwoTab();
    if (m.type === 'scroll') {
      moveVp(typeof m.p === 'number' ? m.p : 0);
      return;
    }
    if (!tickerRows) return;
    if (ticker) ticker.hidden = false;
    const p = document.createElement('p');
    p.textContent = `${hms(m.t || Date.now())} · ${label(m)}`;
    tickerRows.appendChild(p);
    while (tickerRows.children.length > 30) tickerRows.removeChild(tickerRows.firstChild);
    tickerRows.scrollTop = tickerRows.scrollHeight;
  };

  ch.onmessage = (e) => {
    const m = e.data;
    if (!m || !m.type || m.tab === TAB_ID) return; // same document
    lastForeign = Date.now();
    if (dot) dot.hidden = false;
    if (m.type === 'hello.ack' || m.type === 'hello') return; // liveness only
    if (document.hidden) {
      buffer.push(m);
      if (buffer.length > 120) buffer.shift();
      return;
    }
    renderEvent(m);
  };

  // phone catch-up: replay the buffered path in about a second
  const onVisible = () => {
    if (document.hidden || !buffer.length) return;
    const batch = buffer;
    buffer = [];
    const step = Math.min(120, 1000 / batch.length);
    batch.forEach((m, i) => setTimeout(() => renderEvent(m), i * step));
  };
  document.addEventListener('visibilitychange', onVisible);

  // ping for the live dot; foreign silence for 10s turns it off
  post({ type: 'hello' });
  const iv = setInterval(() => {
    if (!document.body.contains(root)) return cleanup();
    post({ type: 'hello' });
    if (dot) dot.hidden = Date.now() - lastForeign > 10000;
  }, 4000);

  function cleanup() {
    clearInterval(iv);
    document.removeEventListener('visibilitychange', onVisible);
    try {
      ch.close();
    } catch {}
    dashCleanup = null;
  }
  dashCleanup = cleanup;
}

// ---------------------------------------------------------------------
// landing side: cheap self-contained listeners, no v1 engine imports

export function mountAppBroadcast() {
  if (typeof BroadcastChannel === 'undefined') return;
  let ch;
  try {
    ch = new BroadcastChannel(CH_NAME);
  } catch {
    return;
  }
  const post = (m) => {
    try {
      ch.postMessage(Object.assign({ tab: TAB_ID, t: Date.now() }, m));
    } catch {}
  };

  // answer the dashboard's ping so it can show its live dot
  ch.onmessage = (e) => {
    const m = e.data;
    if (m && m.type === 'hello' && m.tab !== TAB_ID) post({ type: 'hello.ack' });
  };

  const docH = () => Math.max(1, document.documentElement.scrollHeight - innerHeight);
  let lastScrollPost = 0;
  let lastY = scrollY;
  let lastDir = 1;
  let lastRev = 0;
  addEventListener(
    'scroll',
    () => {
      const now = Date.now();
      const y = scrollY;
      const d = y >= lastY ? 1 : -1;
      if (d === -1 && lastDir === 1 && lastY - y > 60 && now - lastRev > 4000) {
        lastRev = now;
        post({ type: 'scroll.reverse' });
      }
      lastDir = d;
      lastY = y;
      if (now - lastScrollPost > 350) {
        lastScrollPost = now;
        post({ type: 'scroll', p: Math.min(1, y / docH()) });
      }
    },
    { passive: true }
  );

  document.addEventListener(
    'pointerup',
    (e) => {
      const el = e.target.closest('[data-k], a, button, input');
      post({ type: 'tap', k: el?.dataset?.k || el?.tagName?.toLowerCase() || 'page' });
    },
    { passive: true }
  );

  let lastInput = Date.now();
  let idleReported = false;
  for (const evt of ['pointerdown', 'scroll', 'keydown', 'touchstart']) {
    addEventListener(
      evt,
      () => {
        lastInput = Date.now();
        idleReported = false;
      },
      { passive: true }
    );
  }
  setInterval(() => {
    if (document.hidden || idleReported) return;
    const idle = Date.now() - lastInput;
    if (idle >= 12000) {
      idleReported = true;
      post({ type: 'idle', s: Math.round(idle / 1000) });
    }
  }, 3000);
}

// ---------------------------------------------------------------------
// self-wiring: hydrate whenever the router opens /app

function wire() {
  const space = document.getElementById('space');
  if (!space) return;
  space.addEventListener('space:open', (e) => {
    if (e.detail?.path === '/app') hydrateApp(space);
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
else wire();
