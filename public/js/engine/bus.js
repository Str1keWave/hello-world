import { logEvent } from './memory.js';
import { countEvent, state } from './state.js';
import { now } from './util.js';

// Every observable user action flows through here as a typed event.
// Nothing reacts to the DOM directly.

const listeners = new Map(); // type -> Set<fn>; '*' for all
const recent = []; // ring buffer of recent events for debug + receipts
const RECENT_CAP = 60;

export function on(type, fn) {
  if (!listeners.has(type)) listeners.set(type, new Set());
  listeners.get(type).add(fn);
  return () => listeners.get(type).delete(fn);
}

export function emit(type, data = null) {
  const ev = { type, data, t: now() };
  countEvent(type);
  logEvent(type, data, ev.t);
  recent.push(ev);
  if (recent.length > RECENT_CAP) recent.shift();

  const exact = listeners.get(type);
  if (exact) for (const fn of exact) safeCall(fn, ev);
  const all = listeners.get('*');
  if (all) for (const fn of all) safeCall(fn, ev);
  return ev;
}

function safeCall(fn, ev) {
  try {
    fn(ev);
  } catch (e) {
    if (state.flags.debug) console.error('[loam] listener error on', ev.type, e);
  }
}

export function recentEvents(n = 10) {
  return recent.slice(-n);
}
