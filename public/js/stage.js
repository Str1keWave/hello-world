// stage.js — the camouflage posture: the Port Sorrel municipal page.
// Every word is a span; some spans are load-bearing vocabulary. Also owns
// gaps (with the one authored tooth-mark), the startled-fish dodge, word
// tremor, and the notice box's live recoil (P12: it dodges, never deadens).

import { on } from './events.js';

const DODGE_R = 90;
const NOTICE_PAD = 64;

let pageEl = null;
let wordMap = Object.create(null);
let counter = 0;
let noticeEl = null;
let toothEl = null;          // the pre-existing bite inside "visi ing"
export let toyEl = null;     // the stray letterform, loose in #loose

const savedText = Object.create(null); // id -> original text (for gapClose)
const dodgeTimers = new Map();         // el -> [timeout ids]

let rectCache = null;   // [{id, el, cx, cy}] home positions (transform-free)
let noticeHome = null;  // home DOMRect of the notice box
let noticeOut = false;

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- DOM helpers ----

function el(tag, cls, parent) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (parent) parent.appendChild(e);
  return e;
}

function wordSpan(text, id) {
  const s = document.createElement('span');
  s.className = 'w';
  const wid = id || 'w' + ++counter;
  s.dataset.w = wid;
  s.textContent = text;
  wordMap[wid] = s;
  return s;
}

// tokens: string (split on spaces, each word its own span) or
// {t, id} (one span, may contain a space — tide phrases) or
// {visiting: true} (the bitten word).
function words(parent, tokens) {
  let first = true;
  const put = (node) => {
    if (!first) parent.appendChild(document.createTextNode(' '));
    parent.appendChild(node);
    first = false;
  };
  for (const tk of tokens) {
    if (typeof tk === 'string') {
      for (const piece of tk.split(' ')) {
        if (piece) put(wordSpan(piece));
      }
    } else if (tk.visiting) {
      put(bittenVisiting());
    } else {
      put(wordSpan(tk.t, tk.id));
    }
  }
}

function bittenVisiting() {
  // "visiting" renders "visi ing": one letterform already pried loose.
  const s = document.createElement('span');
  s.className = 'w';
  const wid = 'w' + ++counter;
  s.dataset.w = wid;
  wordMap[wid] = s;
  s.appendChild(document.createTextNode('visi'));
  toothEl = el('span', 'gap letter-gap', s);
  s.appendChild(document.createTextNode('ing'));
  return s;
}

// ---- the page ----

export function buildStage(root) {
  pageEl = root;
  const sheet = el('div', 'sheet', pageEl);

  const header = el('header', '', sheet);
  const h1 = el('h1', '', header);
  words(h1, [{ t: 'PORT', id: 'PORT' }, { t: 'SORREL', id: 'SORREL' }, '— TIDE TABLES']);
  const sub = el('p', 'sub', header);
  words(sub, ['Official predictions and observations, Port Sorrel harbour.']);

  const nav = el('nav', '', sheet);
  words(nav, [{ t: 'Home', id: 'HOME' }]);

  const table = el('table', 'tides', sheet);
  const thead = el('thead', '', table);
  const hrow = el('tr', '', thead);
  words(el('th', '', hrow), ['Day']);
  words(el('th', '', hrow), [{ t: 'Predicted', id: 'PREDICTED' }]);
  words(el('th', '', hrow), [{ t: 'Observed', id: 'OBSERVED' }]);
  words(el('th', '', hrow), ['Height']);

  const tbody = el('tbody', '', table);
  const rows = [
    ['Mon', [{ t: 'high water', id: 'HIGHWATER' }, '04:12'], [{ t: 'high water' }, '04:19'], [{ t: '4.1 m' }]],
    ['Tue', [{ t: 'low water', id: 'LOWWATER' }, '10:03'], [{ t: 'low water' }, '10:11'], [{ t: '0.8 m' }]],
    ['Wed', [{ t: 'high water' }, '04:58'], [{ t: 'high water' }, '05:06'], [{ t: '4.3 m' }]],
    ['Thu', [{ t: 'low water' }, '11:26'], [{ t: 'low water' }, '11:20'], [{ t: '0.7 m' }]],
    ['Fri', [{ t: 'high water' }, '05:44'], [{ t: 'high water' }, '05:51'], [{ t: '4.2 m' }]],
    ['Sat', [{ t: 'first light', id: 'FIRSTLIGHT' }, '05:41'], [{ t: 'high water' }, '06:19'], [{ t: '4.0 m' }]],
    ['Sun', [{ t: 'low water' }, '12:07'], [{ t: 'low water' }, '12:15'], [{ t: '0.9 m' }]],
  ];
  for (const [day, pred, obs, height] of rows) {
    const tr = el('tr', '', tbody);
    words(el('td', '', tr), [day]);
    words(el('td', '', tr), pred);
    words(el('td', '', tr), obs);
    words(el('td', '', tr), height);
  }

  const cond = el('p', 'conditions', sheet);
  words(cond, ['Conditions:', { t: 'slack', id: 'SLACK' }, 'at 14:20. Sea', { t: 'still.', id: 'STILL' }]);

  noticeEl = el('div', 'notice', sheet);
  words(noticeEl, ['Harbour office', { t: 'hours', id: 'HOURS' }, '9–4. Office hours', { t: 'also', id: 'ALSO' }, 'apply on public holidays.']);

  const updated = el('p', 'updated', sheet);
  words(updated, ['Last updated — see notice.']);

  const footer = el('footer', '', sheet);
  const f1 = el('p', '', footer);
  words(f1, ['© Port Sorrel Harbour Authority. All rights', { t: 'reserved.', id: 'RESERVED' }]);
  const f2 = el('p', '', footer);
  words(f2, [{ t: 'Thank', id: 'THANK' }, { t: 'you', id: 'YOU' }, 'for', { visiting: true }]);

  // the stray letterform — the creature's toy — already loose on the page
  const loose = document.getElementById('loose');
  if (loose) {
    toyEl = el('div', 'glyph', loose);
    el('span', '', toyEl).textContent = 't';
  }

  // measure after layout settles; never during interaction
  requestAnimationFrame(() => requestAnimationFrame(() => {
    placeToy();
    refreshRects();
  }));
  window.addEventListener('resize', () => {
    rectCache = null;
    noticeHome = null;
    placeToy();
  });

  wireNotice();
  return wordMap;
}

function placeToy() {
  if (!toyEl || !toothEl) return;
  // once play has moved it (any transform applied), it is no longer ours
  if (toyEl.style.transform) return;
  const r = toothEl.getBoundingClientRect();
  if (!r.width && !r.height) return;
  toyEl.style.left = (r.left + r.width / 2 + 9) + 'px';
  toyEl.style.top = (r.bottom + 5) + 'px';
}

// ---- rect access (cached; zero layout reads per frame) ----

function refreshRects() {
  rectCache = [];
  for (const id in wordMap) {
    const w = wordMap[id];
    if (noticeEl && noticeEl.contains(w)) continue; // notice moves as one body
    const r = w.getBoundingClientRect();
    if (!r.width && !r.height) continue;
    rectCache.push({ id, el: w, cx: r.left + r.width / 2, cy: r.top + r.height / 2 });
  }
  if (noticeEl) noticeHome = noticeEl.getBoundingClientRect();
}

export function wordRect(id) {
  const w = wordMap[id];
  return w ? w.getBoundingClientRect() : null;
}

export function noSpotRect() {
  return noticeEl ? noticeEl.getBoundingClientRect() : null;
}

// ---- gaps ----

export function gapOpen(id, opts) {
  const w = wordMap[id];
  if (!w || w.classList.contains('gap')) return;
  const rect = w.getBoundingClientRect();
  savedText[id] = w.textContent;
  w.style.width = rect.width + 'px';
  w.textContent = '';
  w.classList.add('gap');
  w.classList.toggle('revocable', !!(opts && opts.revocable));
}

export function gapClose(id) {
  const w = wordMap[id];
  if (!w || !w.classList.contains('gap')) return;
  w.classList.remove('gap', 'revocable');
  w.style.width = '';
  w.textContent = savedText[id] != null ? savedText[id] : '';
  delete savedText[id];
}

// ---- the startled-fish dodge ----

function clearTimers(w) {
  const ts = dodgeTimers.get(w);
  if (ts) for (const t of ts) clearTimeout(t);
  dodgeTimers.set(w, []);
}

export function dodgeNear(x, y) {
  if (!rectCache) refreshRects();
  for (const c of rectCache) {
    const dx = c.cx - x, dy = c.cy - y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d >= DODGE_R || d < 0.5) continue;
    const w = c.el;
    if (w.classList.contains('gap')) continue;
    const amp = 1 - d / DODGE_R;
    const delay = Math.round(d * 1.1); // nearest flinch first, ripple outward
    clearTimers(w);
    const timers = dodgeTimers.get(w);
    if (reduced) {
      // bioluminescence dialect: the school dims and returns
      w.style.transition = `opacity 140ms ease-out ${delay}ms`;
      w.style.opacity = String(1 - amp * 0.45);
      timers.push(setTimeout(() => {
        w.style.transition = 'opacity 1.1s ease-in-out';
        w.style.opacity = '';
      }, delay + 180));
    } else {
      const mag = 6 + amp * 22;
      const ux = dx / d, uy = dy / d;
      const rot = (ux * 2.2).toFixed(2);
      w.style.transition = `transform 170ms cubic-bezier(0.22, 0.9, 0.35, 1) ${delay}ms`;
      w.style.transform = `translate(${(ux * mag).toFixed(1)}px, ${(uy * mag).toFixed(1)}px) rotate(${rot}deg)`;
      timers.push(setTimeout(() => {
        // spring home, ~1.2s with a soft overshoot
        w.style.transition = 'transform 1.2s cubic-bezier(0.28, 1.45, 0.42, 1)';
        w.style.transform = '';
      }, delay + 190));
      timers.push(setTimeout(() => { w.style.transition = ''; }, delay + 1450));
    }
  }
}

// ---- tremor under attention ----

export function trembleWord(id, onOff) {
  const w = wordMap[id];
  if (w) w.classList.toggle('tremble', !!onOff);
}

// ---- the no-spot recoils (P12: refusal in motion, never a dead region) ----

function wireNotice() {
  const near = (p) => p && noticeApproach(p.x, p.y);
  on('touch.move', near);
  on('gesture.strokeMove', near);
  on('touch.up', noticeHomeAgain);
}

function noticeApproach(x, y) {
  if (!noticeEl) return;
  if (!noticeHome) {
    if (!rectCache) refreshRects();
    if (!noticeHome) return;
  }
  const r = noticeHome;
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const inX = x > r.left - NOTICE_PAD && x < r.right + NOTICE_PAD;
  const inY = y > r.top - NOTICE_PAD && y < r.bottom + NOTICE_PAD;
  if (inX && inY) {
    if (reduced) {
      // it flattens and dulls — alive, but refusing
      noticeEl.style.opacity = '0.68';
      noticeOut = true;
      return;
    }
    let dx = cx - x, dy = cy - y;
    let d = Math.sqrt(dx * dx + dy * dy);
    if (d < 1) { dx = 0; dy = 1; d = 1; }
    const reach = Math.max(r.width, r.height) / 2 + NOTICE_PAD;
    const push = (1 - Math.min(1, d / reach)) * 18 + 4;
    noticeEl.style.transition = 'transform 0.28s cubic-bezier(0.25, 0.8, 0.35, 1)';
    noticeEl.style.transform = `translate(${((dx / d) * push).toFixed(1)}px, ${((dy / d) * push).toFixed(1)}px)`;
    noticeOut = true;
  } else if (noticeOut) {
    noticeHomeAgain();
  }
}

function noticeHomeAgain() {
  if (!noticeEl || !noticeOut) return;
  noticeOut = false;
  if (reduced) {
    noticeEl.style.opacity = '';
    return;
  }
  noticeEl.style.transition = 'transform 0.7s cubic-bezier(0.3, 1.4, 0.45, 1)';
  noticeEl.style.transform = '';
}
