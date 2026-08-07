// play.js — DYNAMICS: toy glyph physics + creature play behavior.
// Loose physics, possession tracking (last mover), keepaway chase with banking
// overshoot, wrong-guess predictor (baits capped), offer behavior, carried-gift
// tether + deterministic collision reporting. The shatter itself is the arc's
// job — this module only reports play.collision (P6: watched causality; real
// overlap only, never speed, never a graze).

import { on, emit } from './events.js';
import { T } from './tunables.js';
import { skin } from './skin.js';

const GRAB_R = 48;            // finger-to-toy grab radius (beyond toy half-size)
const NOSE_R = 64;            // locus-to-toy distance where nosing begins
const LOCUS_DROP_R = 90;      // release this close to the locus = handing over (P11)
const THUMB_R = 70;           // toy delivered when this close to the touch point
const BREAK_R = 120;          // fling landed this far off habit = pattern broken
const REST_V = 0.06;          // px/frame below which the toy is at rest
const NUDGE_MS = 700;         // beat between nose nudges
const HOLD_BEAT_MS = 480;     // wrong-guess: hold the wrong spot one beat
const OFFER_WAIT_MS = 6000;   // unanswered offer window
const OFFER_COOLDOWN_MS = 8000;
const APPROACH_STEP_MS = 400; // locus re-steer cadence while approaching
const CHASE_BANK_MS = 550;    // overshoot before the corrective turn
const MAX_OFFERS = 3;

let toy = null;               // { el, w, h, ox, oy, x, y, vx, vy }
let gift = null;              // same shape + carried flag
let vw = 0, vh = 0;

let playEnabled = true;
let possession = null;        // 'visitor' | 'creature' | null (last mover)
let engaged = false;          // visitor has ever taken the toy

let grabbed = false;
let grabId = null;
let releasedAt = -1e9;
let touch = { x: 0, y: 0, id: null, active: false };
let lastTouch = null;         // last known touch point

let flight = null;            // { px, py, collided } while the toy is airborne
let flingEnds = [];           // last 3 fling endpoints
let baits = 0;
let baitCap = 2;
let predicted = null;

let mode = 'idle';            // idle|approach|nose|deliver|chase|bait|baitHold
let modeT = 0;
let stepT = 0;
let nudgeT = 0;
let nudges = 0;
let offering = false;
let offersMade = 0;
let ignores = 0;
let offerCooldownUntil = 0;
let chaseCorrectT = 0;
let chaseLanding = null;

let mounted = false;
let lastFrame = 0;

const hyp = Math.hypot;

function distToToy(x, y) { return hyp(x - toy.x, y - toy.y); }

function measure(el) {
  const r = el.getBoundingClientRect(); // once, at mount/carry — never in the loop
  return { w: r.width, h: r.height, ox: r.left + r.width / 2, oy: r.top + r.height / 2 };
}

function place(o) {
  o.el.style.transform = 'translate3d(' + (o.x - o.ox) + 'px,' + (o.y - o.oy) + 'px,0)';
}

function meanEnds() {
  let x = 0, y = 0;
  for (const p of flingEnds) { x += p.x; y += p.y; }
  return { x: x / flingEnds.length, y: y / flingEnds.length };
}

// ---- touch wiring ---------------------------------------------------------

function onDown(d) {
  touch = { x: d.x, y: d.y, id: d.id, active: true };
  lastTouch = { x: d.x, y: d.y };
  if (!toy) return;
  if (distToToy(d.x, d.y) <= GRAB_R + toy.w / 2) {
    if (possession === 'creature') emit('play.swap', {}); // it pushed, you take (P11)
    grabbed = true;
    grabId = d.id;
    flight = null;
    possession = 'visitor';
    engaged = true;
    offering = false;
    mode = 'idle';
  }
}

function onMove(d) {
  if (d.id === touch.id) {
    touch.x = d.x; touch.y = d.y;
    lastTouch = { x: d.x, y: d.y };
  }
}

function onUp(d) {
  if (d.id === touch.id) touch.active = false;
  lastTouch = { x: d.x, y: d.y };
  if (grabbed && d.id === grabId) {
    grabbed = false;
    grabId = null;
    releasedAt = performance.now();
    // a flick classification may follow within the same release; wait a breath,
    // and if none came and the toy was left beside the body, it will take it
    setTimeout(() => {
      if (!toy || flight || grabbed) return;
      const L = skin.locus();
      if (hyp(L.x - toy.x, L.y - toy.y) <= LOCUS_DROP_R) beginTake();
    }, 60);
  }
}

function onFlick(d) {
  if (!toy) return;
  if (performance.now() - releasedAt > 120) return; // only a release over the toy flings it
  toy.vx = d.vx * 16.7; // px/ms -> px/frame
  toy.vy = d.vy * 16.7;
  startFlight();
}

function beginTake() {
  // visitor left the toy by the creature: it moves in to take it
  mode = 'approach';
  stepT = 0;
  offering = false;
  pendingSwap = true;
}
let pendingSwap = false;

function startFlight() {
  flight = { px: toy.x, py: toy.y, collided: false };
  possession = 'visitor';
  engaged = true;
  pendingSwap = false;
  if (!playEnabled) return;
  if (mode === 'approach' || mode === 'nose' || mode === 'deliver') {
    // keepaway: it was coming for the toy and you snatched it away — chase,
    // banking past the landing point before correcting (P11 texture)
    const f = T.glyph.friction;
    const lx = toy.x + toy.vx / (1 - f);
    const ly = toy.y + toy.vy / (1 - f);
    chaseLanding = {
      x: Math.max(20, Math.min(vw - 20, lx)),
      y: Math.max(20, Math.min(vh - 20, ly)),
    };
    const sp = hyp(toy.vx, toy.vy) || 1;
    skin.moveLocus(
      chaseLanding.x + (toy.vx / sp) * 70,
      chaseLanding.y + (toy.vy / sp) * 70,
      0.8
    );
    chaseCorrectT = performance.now() + CHASE_BANK_MS;
    mode = 'chase';
    emit('play.chase', {});
  } else if (flingEnds.length >= 3 && baits < baitCap && Math.random() < 0.5) {
    // wrong-guess bait: commit to the habitual target BEFORE the toy lands
    baits++;
    predicted = meanEnds();
    skin.moveLocus(predicted.x, predicted.y, 0.85);
    mode = 'bait';
  }
}

function endFlight() {
  const end = { x: toy.x, y: toy.y };
  flingEnds.push(end);
  if (flingEnds.length > 3) flingEnds.shift();
  flight = null;
  if (mode === 'bait' && predicted) {
    if (hyp(end.x - predicted.x, end.y - predicted.y) > BREAK_R) {
      mode = 'baitHold'; // caught leaning the wrong way: hold it one beat
      modeT = performance.now();
    } else {
      mode = 'idle';     // guessed right — already there, play resumes
      predicted = null;
    }
  } else if (mode === 'chase') {
    mode = 'idle';
  }
  // a soft toss that lands beside the body reads as an offer to it too
  if (possession === 'visitor' && !grabbed && toy) {
    const L = skin.locus();
    if (hyp(L.x - toy.x, L.y - toy.y) <= LOCUS_DROP_R) pendingSwap = true;
  }
}

// ---- frame loop -----------------------------------------------------------

function stepBody(o, f) {
  const damp = Math.pow(T.glyph.friction, f);
  o.vx *= damp;
  o.vy *= damp;
  o.x += o.vx * f;
  o.y += o.vy * f;
  const m = o.w / 2 + 2;
  if (o.x < m) { o.x = m; o.vx = -o.vx * 0.45; }
  else if (o.x > vw - m) { o.x = vw - m; o.vx = -o.vx * 0.45; }
  if (o.y < m) { o.y = m; o.vy = -o.vy * 0.45; }
  else if (o.y > vh - m) { o.y = vh - m; o.vy = -o.vy * 0.45; }
}

// swept segment vs rect (slab method) — deterministic geometry, no speed term
function segmentHitsRect(x0, y0, x1, y1, cx, cy, hw, hh) {
  const dx = x1 - x0, dy = y1 - y0;
  let t0 = 0, t1 = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [x0 - (cx - hw), (cx + hw) - x0, y0 - (cy - hh), (cy + hh) - y0];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return false;
    } else {
      const r = q[i] / p[i];
      if (p[i] < 0) { if (r > t1) return false; if (r > t0) t0 = r; }
      else { if (r < t0) return false; if (r < t1) t1 = r; }
    }
  }
  return true;
}

function tick(t) {
  requestAnimationFrame(tick);
  if (!toy) return;
  const dt = lastFrame ? Math.min(50, t - lastFrame) : 16.7;
  lastFrame = t;
  const f = dt / 16.7;

  // toy physics
  if (grabbed && touch.active) {
    toy.vx += (touch.x - toy.x) * T.glyph.spring * f;
    toy.vy += (touch.y - toy.y) * T.glyph.spring * f;
    stepBody(toy, f);
  } else {
    stepBody(toy, f);
  }
  place(toy);

  // gift physics: tethered to the touch while touching, resting where left
  if (gift) {
    if (gift.carried && touch.active) {
      gift.vx += (touch.x - gift.x) * T.glyph.carrySpring * f;
      gift.vy += (touch.y - gift.y) * T.glyph.carrySpring * f;
    }
    stepBody(gift, f);
    place(gift);

    // collision: flung toy trajectory must actually overlap the carried gift —
    // rect shrunk so a graze along the edge does not count (P6)
    if (flight && !flight.collided && gift.carried) {
      const hw = gift.w / 2 + toy.w * 0.25;
      const hh = gift.h / 2 + toy.h * 0.25;
      if (segmentHitsRect(flight.px, flight.py, toy.x, toy.y, gift.x, gift.y, hw, hh)) {
        flight.collided = true;
        emit('play.collision', { gx: gift.x, gy: gift.y });
      }
    }
  }

  // flight bookkeeping
  if (flight) {
    flight.px = toy.x;
    flight.py = toy.y;
    if (!grabbed && hyp(toy.vx, toy.vy) < REST_V) endFlight();
  }

  if (playEnabled) behave(t);
}

function behave(t) {
  const atRest = !grabbed && !flight && hyp(toy.vx, toy.vy) < REST_V;

  switch (mode) {
    case 'idle': {
      if (grabbed) break;
      if (possession === 'visitor' && atRest) {
        // your toy, lying still: it comes over to nose it back to you
        mode = 'approach';
        stepT = 0;
      } else if (!engaged && offersMade < MAX_OFFERS && atRest && lastTouch &&
                 t > offerCooldownUntil) {
        // you have not played with it yet: it will bring the toy to your thumb
        offering = true;
        mode = 'approach';
        stepT = 0;
      }
      break;
    }

    case 'approach': {
      if (grabbed || flight) { mode = 'idle'; break; }
      if (t - stepT >= APPROACH_STEP_MS) {
        stepT = t;
        const L = skin.locus();
        // overshoot: steer a little past the toy, moveLocus eases the rest
        skin.moveLocus(
          toy.x + (toy.x - L.x) * 0.15,
          toy.y + (toy.y - L.y) * 0.15,
          0.5
        );
        if (hyp(L.x - toy.x, L.y - toy.y) < NOSE_R + toy.w / 2) {
          mode = 'nose';
          nudges = 0;
          nudgeT = 0;
        }
      }
      break;
    }

    case 'nose': {
      if (grabbed || flight) { mode = 'idle'; break; }
      if (t - nudgeT >= NUDGE_MS && atRest) {
        nudgeT = t;
        nudges++;
        const target = lastTouch || { x: vw / 2, y: vh * 0.7 };
        const ddx = target.x - toy.x, ddy = target.y - toy.y;
        const d = hyp(ddx, ddy) || 1;
        const wob = (Math.random() - 0.5) * 0.5; // imperfect aim, alive
        const ux = ddx / d, uy = ddy / d;
        toy.vx += (ux - uy * wob) * 1.7;
        toy.vy += (uy + ux * wob) * 1.7;
        skin.excite(toy.x, toy.y, 0.45);
        skin.moveLocus(toy.x - ux * 34, toy.y - uy * 34, 0.4); // trails behind, pushing
        if (pendingSwap) {
          pendingSwap = false;
          emit('play.swap', {}); // you released it to the body and it took it (P11)
        }
        possession = 'creature';
        if (d < THUMB_R) {
          mode = 'deliver';
          modeT = t;
        } else if (nudges > 6) {
          mode = 'idle';
          offerCooldownUntil = t + OFFER_COOLDOWN_MS;
          offering = false;
        }
      }
      break;
    }

    case 'deliver': {
      if (grabbed || flight) { mode = 'idle'; break; } // taking it = swap, in onDown
      if (offering && t - modeT > OFFER_WAIT_MS) {
        offering = false;
        offersMade++;
        ignores++;
        emit('play.offerIgnored', { n: ignores });
        offerCooldownUntil = t + OFFER_COOLDOWN_MS;
        // it drifts back off, small and slow
        const L = skin.locus();
        skin.moveLocus(L.x + (vw / 2 - L.x) * 0.25, L.y + (vh / 2 - L.y) * 0.25, 0.15);
        mode = 'idle';
      } else if (!offering && t - modeT > 4000) {
        mode = 'idle';
      }
      break;
    }

    case 'chase': {
      if (chaseLanding && t >= chaseCorrectT) {
        // the corrective turn after banking past the target
        skin.moveLocus(chaseLanding.x, chaseLanding.y, 0.5);
        chaseLanding = null;
      }
      break;
    }

    case 'bait':
      break; // committed; resolution happens when the flight ends

    case 'baitHold': {
      if (t - modeT > HOLD_BEAT_MS) {
        // wrong: it slinks — small, slow retreat from where the toy really went
        const L = skin.locus();
        const ddx = L.x - toy.x, ddy = L.y - toy.y;
        const d = hyp(ddx, ddy) || 1;
        skin.moveLocus(L.x + (ddx / d) * 55, L.y + (ddy / d) * 55, 0.15);
        emit('play.wrongGuess', {});
        predicted = null;
        mode = 'idle';
      }
      break;
    }
  }
}

// ---- exports --------------------------------------------------------------

export function mountPlay(toyEl) {
  if (mounted) return;
  mounted = true;
  vw = window.innerWidth;
  vh = window.innerHeight;
  const m = measure(toyEl);
  toy = { el: toyEl, w: m.w, h: m.h, ox: m.ox, oy: m.oy, x: m.ox, y: m.oy, vx: 0, vy: 0 };
  window.addEventListener('resize', () => {
    vw = window.innerWidth;
    vh = window.innerHeight;
  });
  on('touch.down', onDown);
  on('touch.move', onMove);
  on('touch.up', onUp);
  on('gesture.flick', onFlick);
  requestAnimationFrame(tick);
}

export function setPlayEnabled(b) {
  playEnabled = !!b;
  if (!playEnabled) {
    mode = 'idle';
    offering = false;
  }
}

export function setBaitCap(n) {
  baitCap = n | 0;
}

export function carryGift(el) {
  const m = measure(el);
  gift = { el, w: m.w, h: m.h, ox: m.ox, oy: m.oy, x: m.ox, y: m.oy, vx: 0, vy: 0, carried: true };
}

export function stopCarry() {
  gift = null; // element stays where its transform left it
}

export function toyPos() {
  return toy ? { x: toy.x, y: toy.y } : { x: 0, y: 0 };
}
