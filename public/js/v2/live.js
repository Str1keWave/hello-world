// In-session systems. Self-contained sensing (v1's bus/state are not
// loaded — they would write to the v1 relics). Events still log to the
// shared IndexedDB so /app's session streams stay real.
import { T } from './tunables.js';
import { s, save } from './state.js';
import { logEvent } from '../engine/memory.js';
import { restoreTestimonial } from './composition.js';

function score(kind, n) {
  const w = T.investigation.weights[kind] || 0;
  s.investigation.thisVisitScore += w * (n || 1);
  save();
}

export function mountLive(visitInfo) {
  if (s.ended || s.masked) {
    if (s.masked) mountMinimalLogging();
    return;
  }

  mountSensing();
  mountDwell();
  mountFreezeTracking(visitInfo);
  maybeOverheard();
  maybeExperiment();
}

// --- sensing (logs to IDB; scores investigation) ---------------------
function mountSensing() {
  let lastY = 0;
  let maxY = 0;
  let dir = 1;
  let lastReverse = 0;
  addEventListener(
    'scroll',
    () => {
      const y = scrollY;
      const d = y > lastY ? 1 : -1;
      if (dir === 1 && d === -1 && maxY > 500 && Date.now() - lastReverse > 5000) {
        lastReverse = Date.now();
        logEvent('scroll.reverse', { atY: Math.round(y) }, Date.now());
        score('scroll.reverse');
      }
      dir = d;
      lastY = y;
      maxY = Math.max(maxY, y);
    },
    { passive: true }
  );

  document.addEventListener(
    'pointerup',
    (e) => {
      const el = e.target.closest('[data-k], a, button, input') || e.target;
      logEvent('tap', { kind: el.dataset?.k || el.tagName?.toLowerCase() || 'page' }, Date.now());
    },
    { passive: true }
  );

  document.addEventListener('selectionchange', () => {
    clearTimeout(mountSensing._selT);
    mountSensing._selT = setTimeout(() => {
      const t = document.getSelection()?.toString().trim() || '';
      if (t.length > 3) {
        logEvent('text.select', { len: t.length }, Date.now());
        score('text.select');
      }
    }, 700);
  });

  // active stills (P13: requires visible + recent input)
  let lastInput = Date.now();
  for (const evt of ['pointerdown', 'scroll', 'keydown', 'touchstart']) {
    addEventListener(evt, () => (lastInput = Date.now()), { passive: true });
  }
  setInterval(() => {
    if (!document.hidden && Date.now() - lastInput > 15000 && Date.now() - lastInput < 45000) {
      score('still.active');
      lastInput -= 60000; // one still per pause
    }
  }, 10000);

  // the name field: E4 ammunition only; nothing ever reacts in-session
  const nameInput = document.getElementById('field-name');
  if (nameInput) {
    let prev = '';
    nameInput.addEventListener('input', () => {
      const v = nameInput.value;
      if (prev.length >= 3 && v.length <= prev.length - 3) {
        s.deletedText.push(prev);
        if (s.deletedText.length > 5) s.deletedText.shift();
        save();
        logEvent('input.deleted', { len: prev.length }, Date.now());
      }
      prev = v;
    });
    document.getElementById('signup-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = nameInput.value.trim();
      if (name && /^[a-z][a-z'\- ]{1,29}$/i.test(name)) {
        s.name = name.slice(0, 30);
        save();
      }
      logEvent('input.submit', { named: !!name }, Date.now());
      const btn = document.getElementById('signup-btn');
      if (btn) btn.textContent = 'Requested';
    });
  }
}

function mountMinimalLogging() {
  document.addEventListener('pointerup', () => logEvent('tap', { masked: true }, Date.now()), { passive: true });
}

// --- dwell + dangling-ref healing (S1: seen evidence heals next visit)
function mountDwell() {
  s.healed = s.healed || [];
  const targets = [
    ['testimonials-count', '#testimonials h2'],
    ['pricing-count', '#pricing-compare'],
  ];
  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        const ref = en.target.dataset.dangling;
        setTimeout(() => {
          // still on screen after 4s = read; heals at a later settlement
          const r = en.target.getBoundingClientRect();
          const stillVisible = r.top < innerHeight && r.bottom > 0;
          if (stillVisible && s.danglingRefs.includes(ref) && !s.healed.includes(ref)) {
            s.pendingHeal = s.pendingHeal || [];
            if (!s.pendingHeal.includes(ref)) {
              s.pendingHeal.push(ref);
              score('ritual.recheck');
              save();
            }
          }
        }, 4000);
      }
    },
    { threshold: 0.9 }
  );
  for (const [ref, sel] of targets) {
    const el = document.querySelector(sel);
    if (el && s.danglingRefs.includes(ref)) {
      el.dataset.dangling = ref;
      io.observe(el);
    }
  }
  // promote pending heals from previous sessions (settled overnight)
  if (s.pendingHeal?.length) {
    for (const ref of s.pendingHeal) if (!s.healed.includes(ref)) s.healed.push(ref);
    s.pendingHeal = [];
    save();
  }
}

// --- C3: the watched section freezes ---------------------------------
function mountFreezeTracking(visitInfo) {
  if (s.frozen || !visitInfo.isNewVisit) return;
  const start = Date.now();
  const check = () => {
    if (Date.now() - start > 90000) return removeEventListener('scroll', onScroll);
    const sections = document.querySelectorAll('main section[id]');
    for (const sec of sections) {
      if (sec.id === 'hero') continue;
      const r = sec.getBoundingClientRect();
      if (r.top < innerHeight * 0.5 && r.bottom > innerHeight * 0.5 && scrollY > 200) {
        recordFirstCheck(sec.id);
        removeEventListener('scroll', onScroll);
        return;
      }
    }
  };
  const onScroll = () => requestAnimationFrame(check);
  addEventListener('scroll', onScroll, { passive: true });
}

function recordFirstCheck(sectionId) {
  const t = s.freezeTrack;
  if (t.section === sectionId) {
    t.count += 1;
    if (t.count >= T.freezeVisits) s.frozen = sectionId;
  } else {
    t.section = sectionId;
    t.count = 1;
  }
  save();
}

// --- S4: Overheard ---------------------------------------------------
function maybeOverheard() {
  if (s.overheardAt !== -2) return;
  const delay = 22000 + Math.random() * 15000;
  setTimeout(() => {
    if (document.hidden || s.overheardAt !== -2) return;
    s.overheardAt = Date.now();
    save();
    logEvent('overheard.shown', {}, Date.now());
    const w = document.createElement('div');
    w.id = 'chatw';
    w.innerHTML = `
      <div class="chatw-head">Loam · internal</div>
      <div class="chatw-body"></div>`;
    document.body.appendChild(w);
    const body = w.querySelector('.chatw-body');
    const lines = ['— is it ready', '— been ready for weeks', '— so why are we holding', '— ask the founder'];
    lines.forEach((ln, i) => {
      setTimeout(() => {
        if (!document.body.contains(w)) return;
        const p = document.createElement('p');
        p.textContent = ln;
        body.appendChild(p);
      }, 500 + i * 900);
    });
    const kill = () => w.remove();
    setTimeout(kill, 500 + 4 * 900 + T.overheardHoldMs);
    document.addEventListener('visibilitychange', function once() {
      if (document.hidden) {
        kill();
        document.removeEventListener('visibilitychange', once);
      }
    });
  }, delay);
}

// --- the experiment: the one motion ever made under observation ------
function maybeExperiment() {
  if (s.experimentState !== 1) return;
  let lastInput = Date.now();
  for (const evt of ['pointerdown', 'scroll', 'touchstart']) {
    addEventListener(evt, () => (lastInput = Date.now()), { passive: true });
  }
  const section = document.getElementById('testimonials');
  if (!section) return;
  const started = Date.now();
  const iv = setInterval(() => {
    if (Date.now() - started > T.experimentWitnessMs) return clearInterval(iv);
    if (document.hidden || s.experimentState !== 1) return;
    const r = section.getBoundingClientRect();
    const inView = r.top < innerHeight * 0.7 && r.bottom > innerHeight * 0.3;
    const active = Date.now() - lastInput < 10000;
    if (inView && active) {
      clearInterval(iv);
      const fig = restoreTestimonial();
      if (fig) {
        fig.classList.add('restored');
        s.experimentState = 2;
        s.convergence = T.convergence.experimentFloor;
        s.betaLine = 2;
        save();
        logEvent('experiment.witnessed', {}, Date.now());
      }
    }
  }, 800);
}
