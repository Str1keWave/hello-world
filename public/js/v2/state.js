// v2 state: separate keys from v1 ('loam2.*'); v1 keys are never touched.
// Multi-channel persistence: localStorage + cookie shadow + IndexedDB flag
// mirror. L5: a reachable wipe yields the pristine mask forever, no tell —
// except the sunset, which survives everything by authored design.

import { T } from './tunables.js';

const LS_KEY = 'loam2.m';
const SS_KEY = 'loam2.s';

function defaults() {
  return {
    v: 2,
    firstSeen: 0,
    lastSeen: 0,
    visits: 0, // distinct visits per L2
    days: [], // distinct local date-strings visited
    act: 0, // derived each boot from gates; stored for reference
    profile: null, // v1 inheritance profile (importer.js) or null
    imported: false,

    // settlement machinery (L1)
    armed: [], // [{id, type, data, armedAt, expiresVisits}]
    settledLog: [], // ids of settlements applied (order matters)
    lastSettleVisit: 0,
    sameDaySettleUsed: false,

    // page composition state (renderer reads these)
    removals: [], // element ids removed so far
    danglingRefs: [], // which dangling references are active
    slipDone: false, // pronoun slip (visit 1, once)
    slipFixed: false,
    humbled: null,
    frozen: null, // section id frozen by C3
    freezeTrack: { section: null, count: 0 },
    staleShown: 0,
    staleRepairs: 0,

    // spine state
    ledger: [], // [{v, text, date, kind, redacted}]
    convergence: T.convergence.start,
    investigation: { lastVisitScore: 0, thisVisitScore: 0, streak: 0, everStreak: false },
    overheardAt: 0, // 0 = not yet; -1 = expired unseen; >0 timestamp shown
    coverupPosted: false,
    appointment: null, // {startTs, endTs, posted, attended, resolved}
    appSeen: false,
    twoTabSeen: false,
    betaLine: 0, // 0 normal, 1 closing soon, 2 gone

    // endgame
    experimentState: 0, // 0 no, 1 armed, 2 witnessed-live, 3 unwitnessed-settled
    experimentSkipped: false, // casual path
    addressAt: 0, // E1 shown
    deletedText: [], // v2-typed-then-deleted (E4)
    name: null,
    retention: null, // 'seed'|'loam'|'bedrock' or null until default
    pricingLiveAt: 0,
    ended: 0, // timestamp of sunset; permanent
    dataRetained: null,

    masked: false, // L5 wipe-mask: pristine site forever
  };
}

export let s = defaults();
let saveTimer = null;

export function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 300);
}

export function saveNow() {
  s.lastSeen = Date.now();
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {}
  writeShadow();
}

function cookieSet(k, v) {
  try {
    document.cookie = `${k}=${encodeURIComponent(v)}; max-age=${60 * 60 * 24 * 400}; path=/; SameSite=Lax`;
  } catch {}
}
function cookieGet(k) {
  const m = document.cookie.match(new RegExp('(?:^|; )' + k + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

// The shadow carries only what L5 needs: existence, ended, retention.
function writeShadow() {
  cookieSet('lm2_x', '1');
  if (s.ended) cookieSet('lm2_e', String(s.ended));
  if (s.dataRetained != null) cookieSet('lm2_r', s.dataRetained ? '1' : '0');
}

export function loadState() {
  let raw = null;
  try {
    raw = localStorage.getItem(LS_KEY);
  } catch {}
  const shadowExists = cookieGet('lm2_x') === '1';
  const shadowEnded = parseInt(cookieGet('lm2_e') || '0', 10);

  if (raw) {
    try {
      s = Object.assign(defaults(), JSON.parse(raw));
      return s;
    } catch {}
  }

  // No local state. If the shadow remembers us, this is a wipe.
  s = defaults();
  if (shadowEnded) {
    // The ending honors its own copy: sunset survives every reset.
    s.ended = shadowEnded;
    s.dataRetained = cookieGet('lm2_r') !== '0';
    s.masked = false;
  } else if (shadowExists) {
    // L5 strict: pre-ending wipe -> the pristine mask, forever, no tell.
    s.masked = true;
  }
  return s;
}

export function sessionData() {
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSessionData(obj) {
  try {
    sessionStorage.setItem(SS_KEY, JSON.stringify(obj));
  } catch {}
}

export function localDayString(ts) {
  // Under ?clockscale, "days" become fixed buckets of scaled length so the
  // whole calendar compresses coherently (spoiler-free fast mode).
  if (T.dayMs !== 24 * 3600 * 1000) return 'p' + Math.floor(ts / T.dayMs);
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// The two clocks (L4): the arc runs on whichever is slower.
export function gateLevel() {
  return Math.min(s.visits, s.days.length);
}
