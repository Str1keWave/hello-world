// skin.js — the creature's body. Pure output organ: reads nothing from other
// modules (tunables only). One rAF loop for the whole piece lives here.
// #skin: coarse chromatophore cell grid, upscaled — breath, clouds,
// excitation, locus, lean, clench, the Break's posture-flicker.
// #aura: wavefront rings, pseudopod, subsong shimmer.

import { T } from './tunables.js';

const TAU = Math.PI * 2;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);

function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry(seed) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- state ----

const PAPER = hexRgb(T.skin.paper);
const INK = hexRgb(T.skin.ink);
const COLS = T.skin.cells[0];
const ROWS = T.skin.cells[1];
const N = COLS * ROWS;

let skinCv = null, auraCv = null, sctx = null, actx = null;
let off = null, octx = null, img = null;   // cell-resolution buffer
let mid = null, mctx = null;               // 4x intermediate for soft upscale
let W = 0, H = 0, dpr = 1;
let running = false;
let lastT = 0;
let reduced = false;

// per-cell fields
const baseLum = new Float32Array(N);   // static paper grain
const baseTint = new Float32Array(N);  // static warm/cool bias (blue channel)
const energy = new Float32Array(N);    // excitation, diffusing
const energyTmp = new Float32Array(N);

// breath
const breath = { rate: T.skin.breathIdle, depth: 0.5, curRate: T.skin.breathIdle, curDepth: 0.5, phase: 0 };

// arousal / clouds
let arousal = 0, arousalCur = 0;
let clouds = [];          // {u, speed, tint, sigma, fixed, alphaPh}
let cloudTimer = 1.0;     // first idle cloud arrives early (P2)

// clench
let clenchCur = 0;
let clenchDecayMs = 900;

// locus (body-mass)
const locusPos = { x: 0, y: 0 };
const locusVel = { x: 0, y: 0 };
const locusTgt = { x: 0, y: 0 };
let locusK = 26;
let wanderPh = Math.random() * TAU;
// reduced-motion crossfade
const locusPrev = { x: 0, y: 0 };
let locusFade = 1;

// leans (papillae), rings, pseudopod, subsongs
let leans = [];     // {x, y, amount, age, life}
let rings = [];     // {x, y, strength, age, life}
let pod = null;     // {x1,y1,x2,y2,progress,ts,seed}
let subsongs = [];  // {x, y, seed, age, life}

// posture flicker (the Break)
let flickOn = false, flickEnv = 0, flickPh = 0;

// ---- init / sizing ----

export function initSkin(canvasSkin, canvasAura) {
  if (running) return;
  skinCv = canvasSkin;
  auraCv = canvasAura;
  sctx = skinCv.getContext('2d');
  actx = auraCv.getContext('2d');

  off = document.createElement('canvas');
  off.width = COLS; off.height = ROWS;
  octx = off.getContext('2d');
  img = octx.createImageData(COLS, ROWS);

  mid = document.createElement('canvas');
  mid.width = COLS * 4; mid.height = ROWS * 4;
  mctx = mid.getContext('2d');
  mctx.imageSmoothingEnabled = true;

  seedGrain();
  resize();
  window.addEventListener('resize', resize);

  locusPos.x = locusTgt.x = locusPrev.x = W * 0.5;
  locusPos.y = locusTgt.y = locusPrev.y = H * 0.62;

  running = true;
  lastT = performance.now();
  requestAnimationFrame(frame);
}

function resize() {
  W = window.innerWidth;
  H = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  for (const cv of [skinCv, auraCv]) {
    cv.width = Math.max(1, Math.round(W * dpr));
    cv.height = Math.max(1, Math.round(H * dpr));
  }
  sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  actx.setTransform(dpr, 0, 0, dpr, 0, 0);
  sctx.imageSmoothingEnabled = true;
}

function seedGrain() {
  const r = mulberry(0x5052534c); // 'PRSL'
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const i = y * COLS + x;
      baseLum[i] = (r() - 0.5) * 2.6 + Math.sin(x * 0.9 + 1.7) * Math.sin(y * 1.28 + 0.4) * 1.1;
      baseTint[i] = (r() - 0.5) * 2.2;
    }
  }
}

// ---- public organ surface ----

export function setBreath(rate, depth) {
  breath.rate = Math.max(0.02, rate);
  breath.depth = clamp(depth, 0, 1);
}

export function setArousal(a) {
  arousal = clamp(a, 0, 1);
}

export function excite(x, y, amount) {
  const cx = (x / W) * COLS, cy = (y / H) * ROWS;
  const amt = clamp(amount, 0, 1.5);
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const gx = Math.round(cx + dx), gy = Math.round(cy + dy);
      if (gx < 0 || gy < 0 || gx >= COLS || gy >= ROWS) continue;
      const d2 = dx * dx + dy * dy;
      const i = gy * COLS + gx;
      energy[i] = clamp(energy[i] + amt * Math.exp(-d2 / 2.2), 0, 1.4);
    }
  }
}

export function clench(level) {
  // startle posture: instant onset (the one permitted snap), organic decay.
  clenchCur = clamp(Math.max(clenchCur, level), 0, 1);
}

export function setClenchDecay(ms) {
  clenchDecayMs = Math.max(120, ms);
}

export function ringAt(x, y, strength) {
  rings.push({ x, y, strength: clamp(strength, 0, 1), age: 0, life: 1.05 });
  if (rings.length > 8) rings.shift();
}

export function leanTo(x, y, amount) {
  leans.push({ x, y, amount: clamp(amount, 0, 1), age: 0, life: 0.85 });
  if (leans.length > 10) leans.shift();
}

export function pseudopod(x1, y1, x2, y2, progress) {
  pod = { x1, y1, x2, y2, progress: clamp(progress, 0, 1), ts: performance.now(), seed: pod ? pod.seed : Math.random() * TAU };
}

let subsongVar = 0;

export function subsong(x, y, glyphish) {
  const seed = hashStr(String(glyphish == null ? '' : glyphish)) + (subsongVar++ % 3) * 977;
  subsongs.push({ x, y, seed, age: 0, life: 0.95 });
  if (subsongs.length > 4) subsongs.shift();
}

export function locus() {
  return reduced ? { x: locusTgt.x, y: locusTgt.y } : { x: locusPos.x, y: locusPos.y };
}

export function moveLocus(x, y, urgency) {
  const u = clamp(urgency == null ? 0.5 : urgency, 0, 1);
  if (reduced) {
    locusPrev.x = locusTgt.x; locusPrev.y = locusTgt.y;
    locusFade = 0;
    locusTgt.x = x; locusTgt.y = y;
    locusPos.x = x; locusPos.y = y;
    return;
  }
  locusTgt.x = x; locusTgt.y = y;
  locusK = 16 + u * 90; // urgency scales spring speed; damping stays under-critical
}

export function flickerStruggle(on) {
  flickOn = !!on;
}

export function setReducedMotion(b) {
  reduced = !!b;
  if (reduced) {
    locusPos.x = locusTgt.x; locusPos.y = locusTgt.y;
    locusVel.x = 0; locusVel.y = 0;
    locusFade = 1;
  }
}

// aggregate, for `import { skin }` style callers
export const skin = {
  initSkin, setBreath, setArousal, excite, clench, setClenchDecay, ringAt,
  leanTo, pseudopod, subsong, locus, moveLocus, flickerStruggle,
  setReducedMotion,
};

// ---- simulation ----

function frame(now) {
  requestAnimationFrame(frame);
  const dt = clamp((now - lastT) / 1000, 0, 0.05);
  lastT = now;
  const t = now / 1000;
  step(dt, t);
  drawSkin(t);
  drawAura(t, now);
}

function step(dt, t) {
  // breath eases toward targets; clench forces fast breathing while it decays
  breath.curRate += (breath.rate - breath.curRate) * Math.min(1, dt * 3);
  breath.curDepth += (breath.depth - breath.curDepth) * Math.min(1, dt * 3);
  let effRate = breath.curRate * (1 + clenchCur * 2.4);
  if (reduced) effRate *= 0.6;
  breath.phase = (breath.phase + effRate * dt * TAU) % TAU;

  arousalCur += (arousal - arousalCur) * Math.min(1, dt * 2);

  // clench: exponential (organic ease-out) recovery
  if (clenchCur > 0.0005) clenchCur *= Math.exp((-dt * 3000) / clenchDecayMs);
  else clenchCur = 0;

  // excitation diffusion + decay
  const diff = Math.min(0.5, dt * 6);
  const keep = Math.exp(-dt * 1.7);
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const i = y * COLS + x;
      const l = x > 0 ? energy[i - 1] : energy[i];
      const r = x < COLS - 1 ? energy[i + 1] : energy[i];
      const u = y > 0 ? energy[i - COLS] : energy[i];
      const d = y < ROWS - 1 ? energy[i + COLS] : energy[i];
      const avg = (l + r + u + d) * 0.25;
      energyTmp[i] = (energy[i] + (avg - energy[i]) * diff) * keep;
    }
  }
  energy.set(energyTmp);

  // clouds: 1-2 soft bands; frequency scales with arousal
  cloudTimer -= dt * (0.35 + arousalCur * 1.85);
  if (cloudTimer <= 0 && clouds.length < 2) {
    const r = Math.random();
    clouds.push({
      u: reduced ? 0.3 + r * 0.4 : -0.25,
      speed: 0.09 + r * 0.06 + arousalCur * 0.07,
      tint: T.skin.cloudTints[(Math.random() * T.skin.cloudTints.length) | 0],
      sigma: 0.11 + r * 0.05,
      alphaPh: Math.random() * TAU,
      age: 0,
    });
    cloudTimer = 5 + Math.random() * 5;
  }
  for (const c of clouds) {
    c.age += dt;
    if (reduced) c.alphaPh += dt * 0.9;
    else c.u += c.speed * dt;
  }
  clouds = clouds.filter((c) => (reduced ? c.age < 9 : c.u < 1.3));

  // locus spring (organic overshoot, zeta ~0.55)
  if (!reduced) {
    wanderPh += dt * 0.35;
    const tx = locusTgt.x + Math.sin(wanderPh) * 10;
    const ty = locusTgt.y + Math.sin(wanderPh * 0.7 + 1.9) * 8;
    const damp = 2 * Math.sqrt(locusK) * 0.55;
    locusVel.x += ((tx - locusPos.x) * locusK - locusVel.x * damp) * dt;
    locusVel.y += ((ty - locusPos.y) * locusK - locusVel.y * damp) * dt;
    locusPos.x += locusVel.x * dt;
    locusPos.y += locusVel.y * dt;
  } else if (locusFade < 1) {
    locusFade = Math.min(1, locusFade + dt / 1.1);
  }

  // leans, rings, subsongs age out
  for (const l of leans) l.age += dt;
  leans = leans.filter((l) => l.age < l.life);
  for (const r of rings) r.age += dt;
  rings = rings.filter((r) => r.age < r.life);
  for (const s of subsongs) s.age += dt;
  subsongs = subsongs.filter((s) => s.age < s.life);

  // posture flicker: 600ms eased cycles, ramped envelope — never jitter
  flickEnv = clamp(flickEnv + (flickOn ? dt / 0.4 : -dt / 0.45), 0, 1);
  if (flickEnv > 0) flickPh = (flickPh + dt / 0.6) % 1;
}

// ---- skin draw ----

function drawSkin(t) {
  const data = img.data;
  const breathLum = Math.sin(breath.phase) * breath.curDepth * 3.2;
  const desat = 1 - clenchCur * 0.75;
  const dark = clenchCur * 6;

  // flicker wave: eased 0..1 within each 600ms cycle
  const wave = flickEnv > 0 ? smooth(0.5 - 0.5 * Math.cos(flickPh * TAU)) : 0;
  const cloudMul = 1 + flickEnv * (wave * 1.7 - 0.55);
  const energyMul = 1 + flickEnv * (wave * 2.1 - 0.35);
  const flickLum = flickEnv * (wave * 1.6 - 0.8);

  // locus glow params (screen px)
  const sig = Math.min(W, H) * 0.17;
  const inv2s2 = 1 / (2 * sig * sig);
  const locGlow = 7.5 + Math.sin(breath.phase) * 1.8;

  // cloud band axis (diagonal sweep)
  const dirx = 0.86, diry = 0.51;

  const cellW = W / COLS, cellH = H / ROWS;

  for (let y = 0; y < ROWS; y++) {
    const py = (y + 0.5) * cellH;
    const y01 = (y + 0.5) / ROWS;
    for (let x = 0; x < COLS; x++) {
      const i = y * COLS + x;
      const px = (x + 0.5) * cellW;
      const x01 = (x + 0.5) / COLS;

      let lum = baseLum[i] + breathLum + flickLum - dark;
      let cr = 0, cg = 0, cb = baseTint[i];

      // passing clouds
      for (let k = 0; k < clouds.length; k++) {
        const c = clouds[k];
        const proj = (x01 * dirx + y01 * diry) / (dirx + diry);
        const d = proj - c.u;
        let amp = Math.exp((-d * d) / (2 * c.sigma * c.sigma)) * (0.3 + arousalCur * 0.3) * cloudMul;
        if (reduced) amp *= 0.5 + 0.5 * Math.sin(c.alphaPh);
        if (amp > 0.004) {
          cr += (c.tint[0] - PAPER[0]) * amp;
          cg += (c.tint[1] - PAPER[1]) * amp;
          cb += (c.tint[2] - PAPER[2]) * amp;
        }
      }

      // excitation: brightening with a rosy cast
      const e = energy[i] * energyMul;
      if (e > 0.004) {
        lum += e * 20;
        const rt = T.skin.cloudTints[1];
        cr += (rt[0] - PAPER[0]) * e * 0.55;
        cg += (rt[1] - PAPER[1]) * e * 0.55;
        cb += (rt[2] - PAPER[2]) * e * 0.55;
      }

      // locus: soft brighter body-mass
      if (!reduced) {
        const dx = px - locusPos.x, dy = py - locusPos.y;
        lum += Math.exp(-(dx * dx + dy * dy) * inv2s2) * locGlow;
      } else {
        const dx1 = px - locusTgt.x, dy1 = py - locusTgt.y;
        lum += Math.exp(-(dx1 * dx1 + dy1 * dy1) * inv2s2) * locGlow * smooth(locusFade);
        if (locusFade < 1) {
          const dx0 = px - locusPrev.x, dy0 = py - locusPrev.y;
          lum += Math.exp(-(dx0 * dx0 + dy0 * dy0) * inv2s2) * locGlow * (1 - smooth(locusFade));
        }
      }

      // papillae lean: raised ridge adjacent to (never under) the point
      for (let k = 0; k < leans.length; k++) {
        const L = leans[k];
        const dx = px - L.x, dy = py - L.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        const rr = d - 26;
        const fall = 1 - L.age / L.life;
        lum += L.amount * Math.exp(-(rr * rr) / 340) * 9 * fall;
      }

      // compose; clench desaturates the chroma
      cr *= desat; cg *= desat; cb *= desat;
      const o = i * 4;
      data[o] = clamp(PAPER[0] + lum + cr, 0, 255);
      data[o + 1] = clamp(PAPER[1] + lum + cg, 0, 255);
      data[o + 2] = clamp(PAPER[2] + lum + cb, 0, 255);
      data[o + 3] = 255;
    }
  }

  octx.putImageData(img, 0, 0);
  mctx.drawImage(off, 0, 0, mid.width, mid.height);

  // whole-skin draw; clench tightens scale (posture), skipped in reduced mode
  sctx.fillStyle = `rgb(${PAPER[0] - 8},${PAPER[1] - 8},${PAPER[2] - 8})`;
  sctx.fillRect(0, 0, W, H);
  if (!reduced && clenchCur > 0.002) {
    const s = 1 - clenchCur * 0.005;
    sctx.save();
    sctx.translate(W / 2, H / 2);
    sctx.scale(s, s);
    sctx.translate(-W / 2, -H / 2);
    sctx.drawImage(mid, 0, 0, W, H);
    sctx.restore();
  } else {
    sctx.drawImage(mid, 0, 0, W, H);
  }
}

// ---- aura draw ----

function drawAura(t, nowMs) {
  actx.clearRect(0, 0, W, H);

  // wavefront rings — always AROUND the point, never under
  for (const r of rings) {
    const p = r.age / r.life;
    const rad = reduced ? T.skin.ringStart + 14 : T.skin.ringStart + r.age * 140;
    const a = r.strength * 0.38 * (1 - p);
    if (a <= 0.004) continue;
    actx.beginPath();
    actx.arc(r.x, r.y, rad, 0, TAU);
    actx.strokeStyle = `rgba(${INK[0]},${INK[1]},${INK[2]},${a})`;
    actx.lineWidth = 1.2 + 3.6 * (1 - p);
    actx.stroke();
    actx.beginPath();
    actx.arc(r.x, r.y, rad * 1.18, 0, TAU);
    actx.strokeStyle = `rgba(${INK[0]},${INK[1]},${INK[2]},${a * 0.35})`;
    actx.lineWidth = 1;
    actx.stroke();
  }

  // pseudopod: tapered tendril of light, alive while being called
  if (pod && nowMs - pod.ts < 150) {
    drawPod(t);
  } else {
    pod = null;
  }

  // subsong: faint almost-letter strokes, shimmering — never a real glyph
  for (const s of subsongs) drawSubsong(s, t);
}

function drawPod(t) {
  const p = pod;
  // reduced motion: full tendril revealed by opacity, no positional growth
  const geo = reduced ? 1 : p.progress;
  const px = lerp(p.x1, p.x2, geo);
  const py = lerp(p.y1, p.y2, geo);
  const dx = px - p.x1, dy = py - p.y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const wob = reduced ? 0 : Math.sin(t * 4.2 + p.seed) * 10 * (0.25 + p.progress * 0.6);
  const cx = (p.x1 + px) / 2 + nx * wob;
  const cy = (p.y1 + py) / 2 + ny * wob;

  const S = 16;
  const alpha = (reduced ? 0.18 + 0.32 * p.progress : 0.5) * (0.4 + 0.6 * p.progress);
  const left = [], right = [];
  for (let i = 0; i <= S; i++) {
    const u = i / S;
    const iu = 1 - u;
    const bx = iu * iu * p.x1 + 2 * iu * u * cx + u * u * px;
    const by = iu * iu * p.y1 + 2 * iu * u * cy + u * u * py;
    // tangent for the normal
    const tx = 2 * iu * (cx - p.x1) + 2 * u * (px - cx);
    const ty = 2 * iu * (cy - p.y1) + 2 * u * (py - cy);
    const tl = Math.sqrt(tx * tx + ty * ty) || 1;
    const w = lerp(9, 1.4, u) * (0.55 + 0.45 * geo);
    left.push([bx + (-ty / tl) * w, by + (tx / tl) * w]);
    right.push([bx + (ty / tl) * w, by + (-tx / tl) * w]);
  }
  actx.beginPath();
  actx.moveTo(left[0][0], left[0][1]);
  for (let i = 1; i < left.length; i++) actx.lineTo(left[i][0], left[i][1]);
  for (let i = right.length - 1; i >= 0; i--) actx.lineTo(right[i][0], right[i][1]);
  actx.closePath();
  actx.fillStyle = `rgba(251,247,235,${alpha})`;
  actx.fill();
  actx.strokeStyle = `rgba(${INK[0]},${INK[1]},${INK[2]},${alpha * 0.22})`;
  actx.lineWidth = 0.8;
  actx.stroke();
}

function drawSubsong(s, t) {
  const rnd = mulberry(s.seed);
  const fadeIn = smooth(Math.min(1, s.age * 6));
  const fadeOut = 1 - s.age / s.life;
  const base = 0.26 * fadeIn * fadeOut;
  const ox = s.x - 22, oy = s.y - 30; // near, above-left: never under the point

  actx.save();
  actx.translate(ox, oy);
  actx.lineCap = 'round';

  // a stem, a partial bowl, sometimes a bar: letter-ish, never a letter
  const stemX = 3 + rnd() * 5;
  const lean2 = (rnd() - 0.5) * 4;
  const strokes = 2 + ((rnd() * 2) | 0);
  for (let k = 0; k < strokes; k++) {
    const ph = rnd() * TAU;
    const a = base * (0.55 + 0.45 * Math.sin(t * 7 + ph));
    if (a <= 0.01) continue;
    actx.strokeStyle = `rgba(${INK[0]},${INK[1]},${INK[2]},${a})`;
    actx.lineWidth = 0.9;
    actx.beginPath();
    if (k === 0) {
      actx.moveTo(stemX, 3 + rnd() * 2);
      actx.quadraticCurveTo(stemX + lean2, 10, stemX + lean2 * 0.5, 16 + rnd() * 2);
    } else if (k === 1) {
      const r = 3.5 + rnd() * 2.5;
      const a0 = rnd() * TAU;
      actx.arc(stemX + 4 + rnd() * 3, 11 + rnd() * 3, r, a0, a0 + 2.2 + rnd() * 2.2);
    } else {
      const yy = 6 + rnd() * 8;
      actx.moveTo(stemX - 2, yy);
      actx.quadraticCurveTo(stemX + 3, yy + (rnd() - 0.5) * 3, stemX + 7 + rnd() * 3, yy + (rnd() - 0.5) * 2);
    }
    actx.stroke();
  }
  actx.restore();
}
