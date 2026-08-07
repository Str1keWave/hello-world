import { on } from './bus.js';
import { state, save } from './state.js';
import { now, pick } from './util.js';
import { speak, renderTemplate } from './dialogue.js';
import { makeCtx } from './ctx.js';

// The rules engine: (event, state, history) -> at most one reaction.
// Rules are data (see docs/RULES.md); content files register them here.

const rulesByEvent = new Map(); // event type -> rule[]
let allRules = [];
let lastResolved = null; // for the debug overlay

export function registerRules(rules) {
  for (const r of rules) {
    if (!r.id || !r.on) {
      console.warn('[loam] bad rule skipped', r);
      continue;
    }
    allRules.push(r);
    const types = Array.isArray(r.on) ? r.on : [r.on];
    for (const t of types) {
      if (!rulesByEvent.has(t)) rulesByEvent.set(t, []);
      rulesByEvent.get(t).push(r);
    }
  }
}

export function ruleStats() {
  return { total: allRules.length, events: rulesByEvent.size, lastResolved };
}

export function coverage() {
  // event type -> rule count, for the QA coverage matrix
  const m = {};
  for (const [t, rs] of rulesByEvent) m[t] = rs.length;
  return m;
}

function eligible(r, ev) {
  const fires = state.firedRules[r.id] || 0;
  if (r.once && fires >= 1) return false;
  if (r.maxFires && fires >= r.maxFires) return false;
  if (r.phase) {
    const [lo, hi] = r.phase;
    if (state.phase < lo || state.phase > hi) return false;
  }
  if (r.cooldown) {
    const last = state.lastFired[r.id] || 0;
    if (now() - last < r.cooldown * 1000) return false;
  }
  if (r.when) {
    try {
      if (!r.when(state, ev)) return false;
    } catch {
      return false;
    }
  }
  if (r.chance != null && Math.random() > r.chance) return false;
  return true;
}

function resolve(ev) {
  const candidates = (rulesByEvent.get(ev.type) || []).filter((r) => eligible(r, ev));
  if (!candidates.length) {
    lastResolved = { ev: ev.type, rule: null, t: ev.t };
    return; // silent state increment already happened in the bus
  }
  const top = candidates.reduce((best, r) => {
    const p = r.priority ?? 10;
    const bp = best.priority ?? 10;
    if (p > bp) return r;
    if (p === bp && Math.random() < 0.5) return r;
    return best;
  });
  fire(top, ev);
}

export function fire(rule, ev) {
  const fires = (state.firedRules[rule.id] || 0) + 1;
  state.firedRules[rule.id] = fires;
  state.lastFired[rule.id] = now();
  lastResolved = { ev: ev.type, rule: rule.id, t: ev.t };

  if (rule.silent) {
    state.silences += 1;
  } else if (rule.say) {
    let text = rule.say;
    if (Array.isArray(text)) text = text[Math.min(fires - 1, text.length - 1)];
    else if (text && typeof text === 'object' && text.pick) text = pick(text.pick);
    if (text) {
      speak(renderTemplate(text, ev), {
        mood: rule.mood || 'calm',
        priority: rule.priority ?? 10,
        ruleId: rule.id,
      });
    }
  }

  if (rule.effect) {
    try {
      rule.effect(makeCtx(ev), ev);
    } catch (e) {
      if (state.flags.debug) console.error('[loam] effect error in', rule.id, e);
    }
  }
  save();
}

// Wire the resolver to every event on the bus.
on('*', resolve);
