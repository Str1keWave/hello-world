import { emit } from '../bus.js';

// Classify what got touched. Interactive/narrative elements carry data-k.
function kindOf(el) {
  const marked = el.closest('[data-k]');
  if (marked) return { kind: marked.dataset.k, el: marked };
  const tag = el.closest('button, a, input, textarea, select, label');
  if (tag) return { kind: tag.tagName.toLowerCase(), el: tag };
  if (el.closest('p, h1, h2, h3, li, blockquote')) return { kind: 'text', el };
  return { kind: 'dead', el };
}

export function mountPointer() {
  let lastTap = { t: 0, kind: '' };
  const rage = { kind: '', times: [] };
  let pressTimer = null;
  let downAt = null;
  let moved = false;

  document.addEventListener(
    'pointerdown',
    (e) => {
      downAt = { x: e.clientX, y: e.clientY, t: Date.now() };
      moved = false;
      const { kind } = kindOf(e.target);
      clearTimeout(pressTimer);
      pressTimer = setTimeout(() => {
        if (!moved) emit('press.long', { kind });
      }, 650);
    },
    { passive: true }
  );

  document.addEventListener(
    'pointermove',
    (e) => {
      if (!downAt) return;
      const dx = e.clientX - downAt.x;
      const dy = e.clientY - downAt.y;
      if (Math.abs(dx) > 12 || Math.abs(dy) > 12) {
        moved = true;
        clearTimeout(pressTimer);
      }
      // horizontal drag on things that don't drag
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 2 && !downAt.dragged) {
        downAt.dragged = true;
        emit('drag.futile', { kind: kindOf(e.target).kind, dx: Math.round(dx) });
      }
    },
    { passive: true }
  );

  document.addEventListener(
    'pointerup',
    (e) => {
      clearTimeout(pressTimer);
      if (!downAt) return;
      const held = Date.now() - downAt.t;
      downAt = null;
      if (moved || held > 600) return; // not a tap

      const { kind, el } = kindOf(e.target);
      const t = Date.now();
      const data = { kind, x: Math.round(e.clientX), y: Math.round(e.clientY) };
      if (el && el.id) data.id = el.id;

      // double tap
      if (t - lastTap.t < 320 && lastTap.kind === kind) {
        emit('tap.double', data);
      }
      lastTap = { t, kind };

      // rage detection: 5+ taps on the same kind within 2.5s
      if (rage.kind !== kind) {
        rage.kind = kind;
        rage.times = [];
      }
      rage.times.push(t);
      rage.times = rage.times.filter((x) => t - x < 2500);
      if (rage.times.length >= 5) {
        emit('tap.rage', { kind, count: rage.times.length });
        if (rage.times.length >= 10) rage.times = []; // reset so escalation re-arms
      }

      if (kind === 'dead') emit('tap.dead', data);
      else if (kind === 'logo') emit('tap.logo', data);
      else emit('tap', data);
    },
    { passive: true }
  );

  // pinch-zoom attempt
  let pinched = false;
  document.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches.length >= 2 && !pinched) {
        pinched = true;
        emit('zoom.pinch', {});
        setTimeout(() => (pinched = false), 4000);
      }
    },
    { passive: true }
  );

  document.addEventListener('contextmenu', (e) => {
    emit('menu.context', { kind: kindOf(e.target).kind });
  });

  document.addEventListener('dragstart', (e) => {
    emit('drag.futile', { kind: kindOf(e.target).kind, native: true });
  });
}
