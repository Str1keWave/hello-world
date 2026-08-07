// nerves.js — DYNAMICS: the state organ { arousal, trust, tension } 0..1.
// Startle economy + habituation (P3: any style of contact habituates; gentleness
// never gates anything here — style shapes texture only). Drives skin breath and
// arousal continuously; emits nerves.startle / nerves.calm / nerves.state.

import { on, emit } from './events.js';
import { T } from './tunables.js';
import { skin } from './skin.js';

let arousal = 0;
let trust = 0;
let tension = 0;
let threshold = T.nerves.startleBase;
let startled = false;

let mounted = false;
let lastTick = 0;
let lastState = 0;

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);

// tension spike from a rough contact; intensity 0..1 scales it
function jolt(base, intensity) {
  tension = clamp01(tension + base + base * 1.3 * intensity);
  arousal = clamp01(arousal + 0.1 + 0.15 * intensity);
  if (tension > threshold) {
    const level = clamp01(tension);
    threshold += T.nerves.habituateStep; // permanent habituation, any style (P3)
    startled = true;
    skin.clench(level);
    emit('nerves.startle', { level });
  }
}

// every classified gesture builds trust — volume, never style, moves the needle
function ease(amount) {
  trust = clamp01(trust + amount);
  arousal = clamp01(arousal + 0.04);
}

function tick(t) {
  const dt = lastTick ? Math.min(100, t - lastTick) : 16.7;
  lastTick = t;
  const k = Math.pow(T.nerves.decay, dt / 16.7);
  tension *= k;
  arousal *= k;

  // calm = slow deep breath; tense = fast shallow. Trust eases both.
  const rate = T.skin.breathIdle * (1 + 2.2 * tension + 0.5 * arousal) * (1 - 0.25 * trust);
  const depth = clamp01(0.3 + 0.55 * (1 - tension) + 0.15 * trust);
  skin.setBreath(rate, depth);
  skin.setArousal(arousal);

  if (t - lastState >= 250) {
    lastState = t;
    emit('nerves.state', { arousal, trust, tension });
  }
  if (startled && tension < 0.1) {
    startled = false;
    emit('nerves.calm', {});
  }
  requestAnimationFrame(tick);
}

export function mountNerves() {
  if (mounted) return;
  mounted = true;

  on('gesture.flick', d => {
    const sp = Math.hypot(d.vx, d.vy);
    jolt(0.24, Math.min(1, sp / (T.flick.minV * 2.5)));
    ease(T.nerves.trustPerEvent);
  });
  on('gesture.hardtap', () => {
    jolt(0.22, 0.35);
    ease(T.nerves.trustPerEvent);
  });
  on('gesture.tap', () => ease(T.nerves.trustPerEvent));
  on('gesture.stroke', () => ease(T.nerves.trustStroke));
  on('gesture.hold', () => ease(T.nerves.trustStroke));
  on('gesture.holdEnd', () => ease(T.nerves.trustPerEvent));
  on('touch.down', () => { arousal = clamp01(arousal + 0.05); });

  requestAnimationFrame(tick);
}

export function state() {
  return { arousal, trust, tension };
}

// Break aftermath: thresholds tighten again, never below the base
export function sensitize(mult) {
  threshold = Math.max(T.nerves.startleBase, threshold * mult);
}

export function serialize() {
  return { threshold, trust };
}

export function restore(s) {
  if (!s) return;
  if (typeof s.threshold === 'number') threshold = Math.max(T.nerves.startleBase, s.threshold);
  if (typeof s.trust === 'number') trust = clamp01(s.trust);
}
