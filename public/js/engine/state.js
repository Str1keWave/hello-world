import { store, cookies } from './memory.js';
import { now, debounce, gapBucket } from './util.js';

function defaults() {
  return {
    v: 1,
    firstSeen: 0,
    lastSeen: 0,
    visits: 0,
    gapMs: 0,
    gapBucket: 'moments',
    phase: 0,
    actionScore: 0,
    name: null,
    ending: null,
    endingsSeen: [],
    reloads: 0,
    totals: {}, // lifetime event counts
    counters: {}, // this-visit event counts (persisted but reset per visit)
    disposition: { kindness: 0, cruelty: 0, patience: 0, curiosity: 0, defiance: 0 },
    flags: {},
    custom: {},
    refusals: [],
    deletedText: [],
    firedRules: {}, // ruleId -> fire count (lifetime)
    lastFired: {}, // ruleId -> timestamp
    silences: 0, // deliberate chosen silences
    discrepancy: null, // set at boot when memory channels disagree
  };
}

export let state = defaults();

const persist = debounce(() => {
  state.lastSeen = now();
  store.saveLocal(state);
  cookies.writeShadow(state);
}, 400);

export function save() {
  persist();
}

export function saveNow() {
  state.lastSeen = now();
  store.saveLocal(state);
  cookies.writeShadow(state);
}

// Boot-time load. Detects returning visits, reload-vs-return, and
// memory-channel discrepancies (localStorage wiped but cookies alive, etc).
export function boot() {
  const t = now();
  const local = store.loadLocal();
  const shadow = cookies.readShadow();
  const session = store.loadSession();

  if (local) {
    state = Object.assign(defaults(), local);
    // deep-merge the containers that must exist
    state.disposition = Object.assign(defaults().disposition, local.disposition);
  }

  // Discrepancy detection between the two long-term channels
  if (!local && shadow && shadow.visits > 0) {
    state.discrepancy = 'local-wiped'; // they cleared site data but cookies survived
    state.visits = shadow.visits;
    state.name = shadow.name || null;
    state.ending = shadow.ending || null;
    state.firstSeen = 0;
    state.flags.memoryHole = true;
  } else if (local && !shadow && local.visits > 1) {
    state.discrepancy = 'cookies-wiped';
  }

  const isReload = !!session; // same-tab session already existed
  state.gapMs = state.lastSeen ? t - state.lastSeen : 0;
  state.gapBucket = gapBucket(state.gapMs);

  if (isReload) {
    state.reloads += 1;
    state.flags.thisIsReload = true;
  } else {
    state.visits += 1;
    state.flags.thisIsReload = false;
    state.counters = {}; // fresh per-visit counters
  }

  if (!state.firstSeen) state.firstSeen = t;
  state.lastSeen = t;

  store.saveSession({ started: session?.started || t, reloads: (session?.reloads || 0) + (isReload ? 1 : 0) });
  saveNow();
  return state;
}

export function countEvent(type) {
  state.counters[type] = (state.counters[type] || 0) + 1;
  state.totals[type] = (state.totals[type] || 0) + 1;
  save();
}

export function nudgeDisposition(delta) {
  for (const k of Object.keys(delta || {})) {
    if (k in state.disposition) state.disposition[k] += delta[k];
  }
  save();
}
