// All timing and gating constants. ?debug can scale the clocks (test only).
const params = new URLSearchParams(location.search);
const SCALE = params.has('clockscale') ? Math.max(0.0001, parseFloat(params.get('clockscale')) || 1) : 1;

export const T = {
  // L2: a "visit" is a resume/load after this many hidden/absent hours
  resumeGapMs: 6 * 3600 * 1000 * SCALE,
  // P1 amendment: the FIRST same-day return still claims one settlement
  firstSameDayReturnSettles: true,

  // Arc gates: min(distinct visits, distinct days) required per beat.
  // (days count also scaled in debug via clockscale on day computation)
  gates: {
    firstRemoval: 2,
    normalization: 3,
    overheard: 4,
    appointment: 5, // posted at this gate; window lands 2-4 days later
    appGate: 4, // /app login wall opens into dashboard
    thinning: 6,
    experiment: 7, // + investigation + appointment resolved
    address: 8, // E1
    sunsetAfterAddressDays: 2, // pricing window, then sunset
  },

  appointmentLeadDays: [2, 4], // window posted this many days out
  appointmentWindowHours: 24, // P8: a maintenance DAY, not an hour

  // investigation scoring
  investigation: {
    weights: {
      'scroll.reverse': 2,
      'page.reload': 2,
      'text.select': 1,
      'nav.back': 2,
      'app.probe': 3,
      'twotab': 3,
      'ritual.recheck': 3,
      'still.active': 1,
    },
    streakThreshold: 6, // per-visit score counting as an investigative visit
    streakVisits: 2, // consecutive investigative visits = a streak
  },

  convergence: {
    start: 61,
    quietVisit: 4,
    selfRepair: 3,
    absentDay: 2,
    investigativeVisit: -5,
    experimentFloor: 12, // where it collapses to
    cap: 97, // cannot cross without the datum it can never get
  },

  // C3 freeze: non-hero section re-checked at visit start this many
  // consecutive visits becomes immutable (P13: pattern is scroll-past-
  // then-return within the first minute, not first-scroll physics)
  freezeVisits: 3,

  overheardHoldMs: 5200,
  experimentWitnessMs: 10 * 60 * 1000, // in-session window to be seen live

  dayMs: 24 * 3600 * 1000 * SCALE,
};

export const DEBUG = params.has('debug');
