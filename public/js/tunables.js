// Every magic number. Builders reference T.* where the contract says so.
export const T = {
  noise: { minTravel: 8, minMs: 40, palmRadius: 40 },
  hold: { onsetMs: 2000, wanderPx: 12 },
  flick: { minV: 1.6 }, // px/ms release velocity
  stroke: { maxSpeed: 0.7, minLen: 60 }, // slow drag classification
  motif: { tapMin: 2, tapMax: 5, quantMs: 90, repeats: 2, shapeTol: 0.35 },

  nerves: {
    startleBase: 0.55, // tension threshold
    habituateStep: 0.06, // threshold rise per startle (any style — P3)
    trustPerEvent: 0.012,
    trustStroke: 0.03,
    decay: 0.9995,
  },

  arc: {
    m1Events: 10, // interactions of ANY kind to leave NERVES (P3)
    m2SwapsOr: 1, // possession swaps, OR:
    m2SustainedEvents: 24, // fallback after 3 ignored offers (P11)
    m3Initiations: 1, // its first initiation, then ostension begins
    ratifyForSlack: 2, // ratified words before SLACK
    usesForEndgame: 2, // use-frequency floor (P8)
    playRoundsToBreak: 3, // organic window before it risks the gift itself
    repairShards: 3,
    fluencyExchanges: 4, // question-games before the name
    restMaxGapMs: 90000, // cadence guarantee (~90s of interaction)
  },

  skin: {
    cells: [20, 36],
    breathIdle: 0.14, // Hz
    paper: '#fbfaf7',
    ink: '#1a5276',
    cloudTints: [[196, 224, 222], [226, 208, 214]],
    ringStart: 48,
  },

  glyph: { spring: 0.12, friction: 0.88, carrySpring: 0.06 },
};

export const DEBUG = new URLSearchParams(location.search).has('debug');
