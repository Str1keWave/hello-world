// L1 settlements: nothing surfaces in the session that caused it. At each
// new visit exactly one due milestone settles (plus bookkeeping), computed
// BEFORE first paint. The renderer (composition.js) then draws the result.
import { T } from './tunables.js';
import { s, save, gateLevel, localDayString } from './state.js';

function today() {
  return localDayString(Date.now());
}

function ledger(v, text, kind = 'note', extra = {}) {
  s.ledger.push({ v, text, date: today(), kind, redacted: false, ...extra });
}

// Ordered milestones; first due-and-unapplied one settles per visit.
const MILESTONES = [
  {
    id: 'removal.testimonial',
    due: () => gateLevel() >= T.gates.firstRemoval,
    apply() {
      s.removals.push('t2'); // the second testimonial figure
      s.danglingRefs.push('testimonials-count'); // heading still says four
      ledger('2.4.1', 'Fixed an issue where a testimonial could overstate.', 'fix');
    },
  },
  {
    id: 'removal.tier',
    due: () => gateLevel() >= T.gates.normalization,
    apply() {
      s.removals.push('tier-canopy');
      s.danglingRefs.push('pricing-count'); // "Compare all four plans."
      ledger('2.4.3', 'Simplified plans.', 'fix');
    },
  },
  {
    id: 'overheard.arm',
    due: () => gateLevel() >= T.gates.overheard && s.overheardAt === 0,
    apply() {
      s.overheardAt = -2; // armed for this session; -1 if it expires unseen
      ledger('2.4.4', 'Support widget dependency bumped.', 'note');
    },
  },
  {
    id: 'coverup.appointment',
    due: () => gateLevel() >= T.gates.appointment && s.overheardAt !== 0 && s.overheardAt !== -2,
    apply() {
      if (s.overheardAt > 0) {
        s.coverupPosted = true;
        ledger('2.4.5', 'Fixed a bug where the support widget could open unprompted.', 'lie');
      }
      const lead = T.appointmentLeadDays[0] + Math.floor(Math.random() * (T.appointmentLeadDays[1] - T.appointmentLeadDays[0] + 1));
      const start = new Date();
      start.setDate(start.getDate() + lead);
      start.setHours(0, 0, 0, 0);
      const startTs = start.getTime();
      s.appointment = {
        startTs,
        endTs: startTs + T.appointmentWindowHours * 3600 * 1000,
        posted: true,
        attended: false,
        resolved: false,
      };
      ledger('2.4.6', `Scheduled maintenance: ${start.toISOString().slice(0, 10)}, up to ${T.appointmentWindowHours}h. Some records will be temporarily unredacted for migration.`, 'window');
    },
  },
  {
    id: 'thinning',
    due: () => gateLevel() >= T.gates.thinning && appointmentResolved(),
    apply() {
      s.betaLine = 1; // "The beta is closing soon."
      ledger('2.5.0', 'Beta convergence checkpoint.', 'note');
    },
  },
  {
    id: 'experiment.arm',
    due: () =>
      gateLevel() >= T.gates.experiment &&
      appointmentResolved() &&
      s.experimentState === 0 &&
      s.investigation.everStreak,
    apply() {
      s.experimentState = 1; // live restoration may fire this session
      // no ledger entry — this beat never gets one, before or after
    },
  },
  {
    id: 'experiment.settle',
    due: () => s.experimentState === 1, // armed last visit, not witnessed
    apply() {
      s.experimentState = 3; // present from now on; no cover-up ever posts
      s.convergence = T.convergence.experimentFloor;
      s.betaLine = 2;
    },
  },
  {
    id: 'experiment.skip',
    due: () =>
      gateLevel() >= T.gates.address &&
      s.experimentState === 0 &&
      !s.investigation.everStreak,
    apply() {
      s.experimentSkipped = true; // casual path: straight to the address
    },
  },
  {
    id: 'address',
    due: () =>
      gateLevel() >= T.gates.address &&
      appointmentResolved() &&
      (s.experimentState >= 2 || s.experimentSkipped),
    apply() {
      s.addressAt = Date.now();
      s.betaLine = 2; // the beta line is gone now regardless of path
    },
  },
  {
    id: 'pricing.live',
    due: () => s.addressAt > 0 && Date.now() - s.addressAt >= T.gates.sunsetAfterAddressDays * T.dayMs,
    apply() {
      s.pricingLiveAt = Date.now();
      ledger('2.6.0', 'Plans finalized.', 'note');
    },
  },
  {
    id: 'sunset',
    due: () => s.pricingLiveAt > 0 && Date.now() - s.pricingLiveAt >= T.gates.sunsetAfterAddressDays * T.dayMs,
    apply() {
      if (s.retention == null) s.retention = 'seed'; // the terms were always on the page
      s.dataRetained = s.retention !== 'seed';
      s.ended = Date.now();
      ledger('3.0.0', 'Loam is winding down.', 'note');
    },
  },
];

function appointmentResolved() {
  if (!s.appointment) return false;
  if (s.appointment.resolved) return true;
  if (Date.now() > s.appointment.endTs) {
    s.appointment.resolved = true;
    if (!s.appointment.attended) {
      ledger('2.4.9', 'Maintenance completed as scheduled.', 'note');
    }
    return true;
  }
  return false;
}

// Called once per NEW visit, before render.
export function settle(isFirstEver) {
  if (s.masked || s.ended) return;

  // expire an unclaimed Overheard from a previous session
  if (s.overheardAt === -2) s.overheardAt = -1;

  // convergence bookkeeping (between visits only)
  if (!isFirstEver) {
    const inv = s.investigation.lastVisitScore >= T.investigation.streakThreshold;
    if (inv) s.convergence += T.convergence.investigativeVisit;
    else s.convergence += T.convergence.quietVisit;
    s.convergence += Math.min(3, Math.max(0, Math.round((Date.now() - s.lastSeen) / T.dayMs))) * T.convergence.absentDay;
    s.convergence += s.staleRepairs * T.convergence.selfRepair;
    s.staleRepairs = 0;
    s.convergence = Math.max(5, Math.min(T.convergence.cap, s.convergence));
  }

  appointmentResolved(); // may post the completed-maintenance entry

  if (!isFirstEver) {
    for (const m of MILESTONES) {
      if (s.settledLog.includes(m.id)) continue;
      let due = false;
      try {
        due = m.due();
      } catch {}
      if (due) {
        m.apply();
        s.settledLog.push(m.id);
        break; // one settlement per return
      }
    }
  }

  // C4: some mid-arc visits render stale (repair reflex food)
  const g = gateLevel();
  s.staleThisSession = g >= 3 && g < T.gates.address && !s.ended && Math.random() < 0.35;

  save();
}

export function isAppointmentLive() {
  return !!s.appointment && Date.now() >= s.appointment.startTs && Date.now() <= s.appointment.endTs;
}

export function markAppointmentAttended() {
  if (s.appointment && isAppointmentLive() && !s.appointment.attended) {
    s.appointment.attended = true;
    s.appointment.resolved = true;
    save();
  }
}
