// F1 — The Inheritance. Reads v1's surviving state (keys left untouched)
// and derives the profile that shapes v2's opening competence. Runs once.
import { s, save } from './state.js';
import { queryLog } from '../engine/memory.js';

export async function runImporter() {
  if (s.imported || s.masked) return;
  s.imported = true;

  let v1 = null;
  try {
    const raw = localStorage.getItem('loam.m'); // v1 key, read-only
    v1 = raw ? JSON.parse(raw) : null;
  } catch {}

  const profile = {
    hadV1: !!v1,
    ending: v1?.ending || null,
    name: v1?.name || null,
    deletedText: Array.isArray(v1?.deletedText) ? v1.deletedText.slice(-3) : [],
    firstSeen: v1?.firstSeen || 0,
    visits: v1?.visits || 0,
    sessionDays: [],
    clipboardSpent: !!v1?.firedRules?.['narrative.phase3.clipboard'],
  };

  // Reconstruct v1 session days from the shared IndexedDB event log.
  try {
    const evs = await queryLog(null, 800);
    const days = new Set();
    for (const e of evs) {
      if (e.t && e.t < (s.firstSeen || Date.now())) {
        const d = new Date(e.t);
        days.add(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`);
      }
    }
    profile.sessionDays = [...days].slice(0, 8);
  } catch {}

  s.profile = profile;
  // E4 ammunition: inherited deleted text seeds the magazine (never surfaced
  // until E1). v2-typed deletions take precedence later.
  if (profile.deletedText.length && !s.deletedText.length) {
    s.deletedText = [...profile.deletedText];
  }
  if (profile.name && !s.name) s.name = profile.name;

  // Backdated late-1.x ledger entries wearing their real v1 calendar.
  if (profile.sessionDays.length) {
    const texts = [
      'Session replay hotfix.',
      'Attention map: percentile rounding.',
      'Retention modal copy, final round.',
      'Form analytics: capture on delete.',
      'Subject profile schema migration.',
    ];
    profile.sessionDays.slice(0, 5).forEach((day, i) => {
      s.ledger.push({
        v: `1.9.${4 + i}`,
        text: texts[i % texts.length],
        date: day,
        kind: 'backdate',
        redacted: false,
      });
    });
  }
  save();
}
