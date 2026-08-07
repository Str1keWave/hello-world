import { emit } from '../bus.js';

export function mountScroll() {
  const t0 = Date.now();
  let lastY = 0;
  let lastT = t0;
  let dir = 0; // 1 down, -1 up
  let maxY = 0;
  let reachedBottom = false;
  let stallTimer = null;
  let scrolledAtAll = false;
  let speedSamples = [];
  let readClassEmitted = null; // 'skim' | 'read'
  let reverseCount = 0;
  let lastReverseAt = 0;

  const doc = document.documentElement;

  function sectionAt(y) {
    const secs = document.querySelectorAll('main section[id]');
    for (const s of secs) {
      const r = s.getBoundingClientRect();
      if (r.top < innerHeight * 0.5 && r.bottom > innerHeight * 0.5) return s.id;
    }
    return null;
  }

  function onScroll() {
    const y = scrollY;
    const t = Date.now();
    const dt = t - lastT || 1;
    const dy = y - lastY;
    const maxScroll = doc.scrollHeight - innerHeight;

    scrolledAtAll = true;

    // velocity sampling for skim/read classification
    if (Math.abs(dy) > 0 && dt < 400) {
      speedSamples.push(Math.abs(dy) / dt); // px per ms
      if (speedSamples.length > 30) speedSamples.shift();
    }

    // direction reversal (meaningfully scrolled up after going down)
    const newDir = dy > 0 ? 1 : dy < 0 ? -1 : dir;
    if (dir === 1 && newDir === -1 && maxY > 400 && t - lastReverseAt > 4000) {
      reverseCount += 1;
      lastReverseAt = t;
      emit('scroll.reverse', { count: reverseCount, atY: Math.round(y) });
    }
    dir = newDir;
    maxY = Math.max(maxY, y);

    // bottom
    if (!reachedBottom && maxScroll > 200 && y >= maxScroll - 40) {
      reachedBottom = true;
      const ms = t - t0;
      emit('scroll.bottom', { ms, fast: ms < 9000 });
    }
    if (reachedBottom && y < 80 && maxY > 400) {
      reachedBottom = false; // re-arm; returning to top is its own thing
      emit('scroll.top.return', {});
    }

    // rubber-band overscroll
    if (y < -24 || (maxScroll > 0 && y > maxScroll + 24)) {
      emit('scroll.overscroll', { edge: y < 0 ? 'top' : 'bottom' });
    }

    // stall: stopped mid-page for a while
    clearTimeout(stallTimer);
    stallTimer = setTimeout(() => {
      const max2 = doc.scrollHeight - innerHeight;
      if (scrollY > innerHeight * 0.4 && scrollY < max2 - innerHeight * 0.4) {
        emit('scroll.stall', { section: sectionAt(scrollY) });
      }
    }, 5000);

    lastY = y;
    lastT = t;
  }

  addEventListener('scroll', onScroll, { passive: true });

  // classify reading style once enough samples exist
  setInterval(() => {
    if (speedSamples.length < 12) return;
    const avg = speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length;
    const cls = avg > 1.4 ? 'skim' : 'read';
    if (cls !== readClassEmitted) {
      readClassEmitted = cls;
      emit(cls === 'skim' ? 'scroll.skim' : 'scroll.read', { avg: +avg.toFixed(2) });
    }
  }, 6000);

  // never scrolled at all
  setTimeout(() => {
    if (!scrolledAtAll) emit('scroll.none', { after: 25 });
  }, 25000);
}
