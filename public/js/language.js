// Ostension, spends, utterances. Words are pried from the page's own body;
// every spend is witnessed, mid-viewport, near recent contact (laws).
import { on, emit } from './events.js';
import { T } from './tunables.js';
import { P, mark, saveP } from './persist.js';
import * as skin from './skin.js';
import * as stage from './stage.js';

let looseEl = null;
const floating = new Map(); // wordId -> {el, x, y}
let lastTouch = { x: innerWidth / 2, y: innerHeight * 0.6 };

export function initLanguage() {
  looseEl = document.getElementById('loose');
  on('touch.down', (d) => (lastTouch = { x: d.x, y: d.y }));
  on('touch.move', (d) => (lastTouch = { x: d.x, y: d.y }));
  // restore permanent gaps + floating words from a prior session, animate
  for (const id of P().gaps) {
    try {
      stage.gapOpen(id, { revocable: false });
      if (id !== 'PREDICTED') spawnFloating(id, skin.locus().x, skin.locus().y);
    } catch {}
  }
}

function wordText(id) {
  const map = {
    SLACK: 'slack', OBSERVED: 'observed', PREDICTED: 'predicted',
    HIGHWATER: 'high water', LOWWATER: 'low water', FIRSTLIGHT: 'first light',
    RESERVED: 'reserved', HOME: 'Home', HOURS: 'hours', ALSO: 'also',
    STILL: 'still', YOU: 'you', THANK: 'Thank', PORT: 'PORT', SORREL: 'SORREL',
  };
  return map[id] || id.toLowerCase();
}

function spawnFloating(id, x, y) {
  const el = document.createElement('span');
  el.className = 'loose-word';
  el.textContent = wordText(id);
  el.style.transform = `translate(${x}px, ${y}px)`;
  looseEl.appendChild(el);
  floating.set(id, { el, x, y });
  return el;
}

// --- ostension: the pseudopod strains toward a word; touching ratifies --
let ostending = null;

export function ostend(wordId) {
  return new Promise((resolve) => {
    if (ostending) return resolve(false);
    const rect = stage.wordRect(wordId);
    if (!rect) return resolve(false);
    const target = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    ostending = { wordId, t0: performance.now(), target, resolve };
    stage.trembleWord(wordId, true);

    const offTap = on('touch.down', (d) => {
      if (!ostending) return;
      const r = stage.wordRect(wordId);
      if (d.x > r.left - 14 && d.x < r.right + 14 && d.y > r.top - 14 && d.y < r.bottom + 14) {
        finishOstend(true);
      }
    });

    function frame(now) {
      if (!ostending) return;
      const p = Math.min(1, (now - ostending.t0) / 1400);
      const l = skin.locus();
      skin.pseudopod(l.x, l.y, target.x, target.y, p);
      if (now - ostending.t0 > 9000) return finishOstend(false); // retract, no penalty
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    function finishOstend(ok) {
      stage.trembleWord(wordId, false);
      offTap();
      ostending = null;
      if (ok) {
        if (!P().ratified.includes(wordId)) P().ratified.push(wordId);
        bumpUse(wordId);
        saveP();
        skin.excite(target.x, target.y, 0.9);
        skin.ringAt(target.x, target.y, 0.8);
        emit('word.ratified', { wordId });
      }
      resolve(ok);
    }
  });
}

export function bumpUse(wordId) {
  P().used[wordId] = (P().used[wordId] || 0) + 1;
  saveP();
}

// --- spends: prying a word out of the body ---------------------------
export function spendWord(wordId, { revocable = false } = {}) {
  const rect = stage.wordRect(wordId);
  if (!rect) return null;
  // rehearsal: subsong shimmer beside the word, then the pry
  skin.subsong(rect.left + rect.width / 2, rect.top - 18, wordText(wordId));
  const el = spawnFloating(wordId, rect.left, rect.top);
  el.classList.add('lifting');
  stage.gapOpen(wordId, { revocable });
  // drift toward the visitor's last contact, settling adjacent (never under)
  const fx = Math.min(Math.max(lastTouch.x + 64, 30), innerWidth - 90);
  const fy = Math.min(Math.max(lastTouch.y - 56, 60), innerHeight - 80);
  requestAnimationFrame(() => {
    el.style.transform = `translate(${fx}px, ${fy}px)`;
    floating.get(wordId).x = fx;
    floating.get(wordId).y = fy;
  });
  if (!revocable && !P().gaps.includes(wordId)) {
    P().gaps.push(wordId);
    saveP();
  }
  emit('word.spent', { wordId, revocable });
  return el;
}

export function repossess(wordId) {
  const f = floating.get(wordId);
  if (!f) return;
  const rect = stage.wordRect(wordId);
  f.el.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
  setTimeout(() => {
    f.el.remove();
    floating.delete(wordId);
    stage.gapClose(wordId);
  }, 420);
  emit('word.repossessed', { wordId });
}

// watched discard: "predicted" is carried to the edge and let go
export function discardWord(wordId) {
  const rect = stage.wordRect(wordId);
  if (!rect) return;
  stage.gapOpen(wordId, { revocable: false });
  const el = spawnFloating(wordId, rect.left, rect.top);
  el.classList.add('discarding');
  requestAnimationFrame(() => {
    el.style.transform = `translate(${innerWidth + 60}px, ${rect.top + 30}px)`;
    el.style.opacity = '0';
  });
  setTimeout(() => {
    el.remove();
    floating.delete(wordId);
  }, 1600);
  if (!P().gaps.includes(wordId)) {
    P().gaps.push(wordId);
    saveP();
  }
  emit('word.spent', { wordId, revocable: false });
}

// --- utterances: floating words pulsed in order near a point ---------
let utterSeq = 0;

export function utter(wordIds, { at = null } = {}) {
  return new Promise((resolve) => {
    const id = ++utterSeq;
    const anchor = at || { x: lastTouch.x, y: Math.max(90, lastTouch.y - 70) };
    const els = wordIds.map((w, i) => {
      let f = floating.get(w);
      if (!f) {
        const el = spawnFloating(w, skin.locus().x, skin.locus().y);
        f = floating.get(w);
      }
      return f;
    });
    els.forEach((f, i) => {
      const x = Math.min(Math.max(anchor.x - 40 + i * 78, 16), innerWidth - 100);
      const y = anchor.y;
      f.el.style.transform = `translate(${x}px, ${y}px)`;
      f.x = x;
      f.y = y;
    });
    wordIds.forEach((w, i) => {
      setTimeout(() => {
        const f = floating.get(w);
        if (!f) return;
        f.el.classList.add('pulse');
        skin.ringAt(f.x + 20, f.y + 8, 0.5);
        bumpUse(w);
        setTimeout(() => f.el.classList.remove('pulse'), 500);
      }, 500 + i * 800);
    });
    setTimeout(() => {
      emit('speech.done', { utteranceId: id });
      resolve(id);
    }, 500 + wordIds.length * 800 + 600);
  });
}

// --- endgame set pieces ----------------------------------------------
export function headerSpend() {
  return new Promise((resolve) => {
    const ids = ['PORT', 'SORREL'];
    const rects = ids.map((i) => stage.wordRect(i));
    ids.forEach((i) => stage.gapOpen(i, { revocable: false }));
    if (!P().gaps.includes('PORT')) P().gaps.push('PORT', 'SORREL');
    saveP();
    const letters = [];
    ids.forEach((idx, wi) => {
      const text = wordText(idx);
      [...text].forEach((ch, ci) => {
        const el = document.createElement('span');
        el.className = 'loose-word name-letter';
        el.textContent = ch;
        const r = rects[wi];
        el.style.transform = `translate(${r.left + ci * (r.width / text.length)}px, ${r.top}px)`;
        looseEl.appendChild(el);
        letters.push(el);
      });
    });
    // scatter, then reform at the visitor's finger
    setTimeout(() => {
      letters.forEach((el) => {
        el.style.transform = `translate(${Math.random() * (innerWidth - 60) + 20}px, ${Math.random() * 200 + 120}px)`;
      });
    }, 700);
    setTimeout(() => {
      const bx = Math.min(Math.max(lastTouch.x - 90, 12), innerWidth - 220);
      const by = Math.max(80, lastTouch.y - 60);
      letters.forEach((el, i) => {
        el.style.transform = `translate(${bx + i * 19}px, ${by}px)`;
      });
      skin.ringAt(bx + 90, by, 1);
    }, 2400);
    setTimeout(() => {
      mark({ named: true });
      emit('word.spent', { wordId: 'NAME', revocable: false });
      resolve(letters);
    }, 4200);
  });
}

export function returnSlack() {
  const f = floating.get('SLACK');
  const rect = stage.wordRect('SLACK');
  if (f && rect) {
    f.el.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
    setTimeout(() => {
      f.el.remove();
      floating.delete('SLACK');
      stage.gapClose('SLACK');
      const idx = P().gaps.indexOf('SLACK');
      if (idx >= 0) P().gaps.splice(idx, 1);
      saveP();
    }, 900);
  }
}

export function floatingWords() {
  return floating;
}
