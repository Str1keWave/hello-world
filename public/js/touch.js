// touch.js — DYNAMICS: gesture grammar, noise floor, motif bank.
// Contract: docs/room3/CONTRACT.md. Emits only touch.*, gesture.*, motif.* events.
// Window-level pointer handling; no DOM reads, no rendering.

import { emit } from './events.js';
import { T } from './tunables.js';

const MOVE_MS = 33;            // ~30Hz throttle for touch.move / gesture.strokeMove
const TAP_MAX_MS = 300;        // tap: short contact
const TAP_MAX_TRAVEL = 10;     // tap: small travel
const HARD_MAX_MS = 90;        // hardtap: very short contact = high implied force
const HARD_MAX_TRAVEL = 4;     // hardtap: near-zero travel
const VEL_WINDOW_MS = 80;      // window for release velocity
const SPEED_WINDOW_MS = 100;   // window for live slow-drag speed
const PHRASE_GAP_MS = 1200;    // silence that closes a tap phrase
const STROKE_LIVE_LEN = 24;    // px of slow travel before strokeMove begins

const active = new Map();      // pointerId -> contact record
let mounted = false;

// ---- motif bank -----------------------------------------------------------

const tapMotifs = new Map();   // pattern key -> { pattern, count, at }
const strokeMotifs = [];       // { shape, count, at }
const established = [];        // [{ kind, m }] in order of establishment
let tapPhrase = [];            // timestamps of the phrase being tapped now
let phraseTimer = 0;

const hyp = Math.hypot;
const nowMs = () => performance.now();

function noteTap(t) {
  if (tapPhrase.length && t - tapPhrase[tapPhrase.length - 1] > PHRASE_GAP_MS) closePhrase();
  tapPhrase.push(t);
  clearTimeout(phraseTimer);
  phraseTimer = setTimeout(closePhrase, PHRASE_GAP_MS);
  if (tapPhrase.length > T.motif.tapMax) closePhrase();
}

function closePhrase() {
  clearTimeout(phraseTimer);
  const taps = tapPhrase;
  tapPhrase = [];
  if (taps.length < T.motif.tapMin || taps.length > T.motif.tapMax) return;
  const pattern = [];
  for (let i = 1; i < taps.length; i++) {
    pattern.push(Math.max(1, Math.round((taps[i] - taps[i - 1]) / T.motif.quantMs)) * T.motif.quantMs);
  }
  const key = pattern.join(',');
  let m = tapMotifs.get(key);
  if (!m) { m = { pattern, count: 0, at: 0 }; tapMotifs.set(key, m); }
  m.count++;
  if (m.count >= T.motif.repeats) {
    if (!m.at) { m.at = nowMs(); established.push({ kind: 'tap', m }); }
    emit('motif.tap', { pattern: m.pattern.slice(), count: m.count });
  }
}

function noteStroke(rawPath) {
  const shape = normalizeShape(resample(rawPath, 16));
  let best = null, bd = Infinity;
  for (const m of strokeMotifs) {
    const d = shapeDist(shape, m.shape);
    if (d < bd) { bd = d; best = m; }
  }
  if (best && bd <= T.motif.shapeTol) {
    best.count++;
    if (best.count >= T.motif.repeats) {
      if (!best.at) { best.at = nowMs(); established.push({ kind: 'stroke', m: best }); }
      emit('motif.stroke', { shape: best.shape.map(p => ({ x: p.x, y: p.y })), count: best.count });
    }
  } else {
    strokeMotifs.push({ shape, count: 1, at: 0 });
  }
}

export function motifBank() {
  const taps = [];
  for (const m of tapMotifs.values()) {
    if (m.at) taps.push({ pattern: m.pattern.slice(), count: m.count });
  }
  const strokes = [];
  for (const m of strokeMotifs) {
    if (m.at) strokes.push({ shape: m.shape.map(p => ({ x: p.x, y: p.y })), count: m.count });
  }
  let first = null;
  if (established.length) {
    const e = established[0];
    first = e.kind === 'tap'
      ? { kind: 'tap', pattern: e.m.pattern.slice(), count: e.m.count }
      : { kind: 'stroke', shape: e.m.shape.map(p => ({ x: p.x, y: p.y })), count: e.m.count };
  }
  return { taps, strokes, first };
}

// ---- geometry helpers -----------------------------------------------------

function resample(path, n) {
  if (path.length < 2) {
    const p = path[0] || { x: 0, y: 0 };
    return Array.from({ length: n }, () => ({ x: p.x, y: p.y }));
  }
  let total = 0;
  for (let i = 1; i < path.length; i++) total += hyp(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
  if (total === 0) return Array.from({ length: n }, () => ({ x: path[0].x, y: path[0].y }));
  const step = total / (n - 1);
  const out = [{ x: path[0].x, y: path[0].y }];
  let acc = 0, i = 1, prev = path[0];
  while (out.length < n - 1 && i < path.length) {
    const seg = hyp(path[i].x - prev.x, path[i].y - prev.y);
    if (seg === 0) { i++; continue; }
    if (acc + seg >= step) {
      const f = (step - acc) / seg;
      const nx = prev.x + (path[i].x - prev.x) * f;
      const ny = prev.y + (path[i].y - prev.y) * f;
      out.push({ x: nx, y: ny });
      prev = { x: nx, y: ny };
      acc = 0;
    } else {
      acc += seg;
      prev = path[i];
      i++;
    }
  }
  const last = path[path.length - 1];
  while (out.length < n) out.push({ x: last.x, y: last.y });
  return out;
}

function normalizeShape(pts) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  const s = Math.max(maxX - minX, maxY - minY) || 1;
  return pts.map(p => ({ x: (p.x - minX) / s, y: (p.y - minY) / s }));
}

function shapeDist(a, b) {
  let d = 0;
  for (let i = 0; i < a.length; i++) d += hyp(a[i].x - b[i].x, a[i].y - b[i].y);
  return d / a.length;
}

function recentSpeed(s) {
  const t = s[s.length - 1].t;
  let i = s.length - 1;
  while (i > 0 && t - s[i - 1].t <= SPEED_WINDOW_MS) i--;
  const dt = t - s[i].t;
  if (dt <= 0) return 0;
  let d = 0;
  for (let j = i + 1; j < s.length; j++) d += hyp(s[j].x - s[j - 1].x, s[j].y - s[j - 1].y);
  return d / dt;
}

function releaseVelocity(s) {
  const last = s[s.length - 1];
  let i = s.length - 1;
  while (i > 0 && last.t - s[i - 1].t <= VEL_WINDOW_MS) i--;
  const a = s[i];
  const dt = last.t - a.t;
  if (dt <= 0) return { vx: 0, vy: 0, sp: 0 };
  const vx = (last.x - a.x) / dt;
  const vy = (last.y - a.y) / dt;
  return { vx, vy, sp: hyp(vx, vy) };
}

// ---- contact lifecycle ----------------------------------------------------

function contactRadius(e) {
  return Math.max(e.width || 0, e.height || 0) / 2;
}

function flushDown(rec) {
  if (rec.flushed || rec.dead) return;
  rec.flushed = true;
  emit('touch.down', { x: rec.x0, y: rec.y0, id: rec.id });
}

function killRec(rec) {
  if (rec.dead) return;
  rec.dead = true;
  clearTimeout(rec.flushTimer);
  clearTimeout(rec.holdTimer);
  // a contact that already announced itself is closed cleanly; it emits no gesture
  if (rec.flushed) emit('touch.up', { x: rec.x, y: rec.y, id: rec.id });
}

function onDown(e) {
  const t = nowMs();
  const rec = {
    id: e.pointerId,
    t0: t, x0: e.clientX, y0: e.clientY,
    x: e.clientX, y: e.clientY,
    pathLen: 0, wander: 0,
    samples: [{ t, x: e.clientX, y: e.clientY }],
    path: [{ x: e.clientX, y: e.clientY }],
    flushed: false, dead: false, holdFired: false, strokeLive: false,
    emX: e.clientX, emY: e.clientY, emT: t, lastPathT: t,
    flushTimer: 0, holdTimer: 0,
  };
  active.set(rec.id, rec);
  if (active.size >= 2) {                      // multi-point: everything ignored (P5)
    for (const r of active.values()) killRec(r);
    return;
  }
  if (contactRadius(e) > T.noise.palmRadius) { // palm-scale: nothing (P5)
    rec.dead = true;
    return;
  }
  rec.flushTimer = setTimeout(() => flushDown(rec), T.noise.minMs);
  rec.holdTimer = setTimeout(() => {
    if (rec.dead || rec.holdFired || rec.wander > T.hold.wanderPx) return;
    flushDown(rec);
    rec.holdFired = true;
    emit('gesture.hold', { x: rec.x, y: rec.y });
  }, T.hold.onsetMs);
}

function onMove(e) {
  const rec = active.get(e.pointerId);
  if (!rec || rec.dead) return;
  if (contactRadius(e) > T.noise.palmRadius) { killRec(rec); return; }
  const t = nowMs();
  const x = e.clientX, y = e.clientY;
  rec.pathLen += hyp(x - rec.x, y - rec.y);
  rec.x = x; rec.y = y;
  rec.wander = hyp(x - rec.x0, y - rec.y0);
  rec.samples.push({ t, x, y });
  while (rec.samples.length > 2 && t - rec.samples[0].t > 160) rec.samples.shift();
  if (!rec.holdFired && rec.wander > T.hold.wanderPx) clearTimeout(rec.holdTimer);
  if (!rec.flushed && rec.pathLen >= T.noise.minTravel) flushDown(rec);
  if (!rec.flushed) return;
  if (t - rec.lastPathT >= MOVE_MS) {
    rec.lastPathT = t;
    rec.path.push({ x, y });
  }
  if (t - rec.emT >= MOVE_MS) {
    const dt = t - rec.emT;
    const dx = x - rec.emX, dy = y - rec.emY;
    const v = hyp(dx, dy) / dt;
    rec.emX = x; rec.emY = y; rec.emT = t;
    emit('touch.move', { x, y, dx, dy, v, id: rec.id });
    const sp = recentSpeed(rec.samples);
    if (!rec.strokeLive && rec.pathLen >= STROKE_LIVE_LEN && sp <= T.stroke.maxSpeed) rec.strokeLive = true;
    else if (rec.strokeLive && sp > T.stroke.maxSpeed * 2) rec.strokeLive = false;
    if (rec.strokeLive) emit('gesture.strokeMove', { x, y, dx, dy });
  }
}

function onUp(e) {
  const rec = active.get(e.pointerId);
  active.delete(e.pointerId);
  if (!rec || rec.dead) return;
  clearTimeout(rec.flushTimer);
  clearTimeout(rec.holdTimer);
  const t = nowMs();
  const dur = t - rec.t0;
  if (!rec.flushed) {
    if (rec.pathLen < T.noise.minTravel && dur < T.noise.minMs) return; // graze: nothing
    flushDown(rec);
  }
  const x = e.clientX, y = e.clientY;
  rec.samples.push({ t, x, y });
  rec.path.push({ x, y });
  emit('touch.up', { x, y, id: rec.id });

  if (rec.holdFired) {
    emit('gesture.holdEnd', { x, y, ms: Math.round(dur) });
    return;
  }
  const { vx, vy, sp } = releaseVelocity(rec.samples);
  if (sp >= T.flick.minV) {
    emit('gesture.flick', { x, y, vx, vy });
    return;
  }
  const avgSpeed = rec.pathLen / Math.max(1, dur);
  if (rec.pathLen >= T.stroke.minLen && avgSpeed <= T.stroke.maxSpeed * 1.25) {
    const path = resample(rec.path, 16);
    const a = path[0], b = path[path.length - 1];
    emit('gesture.stroke', {
      path,
      dir: Math.atan2(b.y - a.y, b.x - a.x),
      len: Math.round(rec.pathLen),
      speed: avgSpeed,
    });
    noteStroke(rec.path);
    return;
  }
  if (dur <= HARD_MAX_MS && rec.pathLen <= HARD_MAX_TRAVEL) {
    emit('gesture.hardtap', { x, y });
    noteTap(t);
    return;
  }
  if (dur <= TAP_MAX_MS && rec.pathLen <= TAP_MAX_TRAVEL) {
    emit('gesture.tap', { x, y });
    noteTap(t);
  }
}

function onCancel(e) {
  const rec = active.get(e.pointerId);
  active.delete(e.pointerId);
  if (rec) killRec(rec);
}

const prevent = e => e.preventDefault();

export function mountTouch() {
  if (mounted) return;
  mounted = true;
  window.addEventListener('contextmenu', prevent, { capture: true });
  window.addEventListener('selectstart', prevent, { capture: true });
  window.addEventListener('pointerdown', onDown, { passive: false });
  window.addEventListener('pointermove', onMove, { passive: false });
  window.addEventListener('pointerup', onUp, { passive: false });
  window.addEventListener('pointercancel', onCancel, { passive: false });
}
