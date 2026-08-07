// FALLBACK TIER + AUTHORING TEMPLATE
// Guarantee: every event type resolves to *something*. These rules sit at
// priority 0–5 so any specific rule beats them. Most are chosen silence —
// the site notices, counts, and elects not to comment (yet).
// The first ten rules double as the authoring examples referenced in docs/RULES.md.

const SILENT_TYPES = [
  'tap', 'tap.double', 'tap.dead', 'tap.logo', 'tap.dialogue', 'press.long',
  'drag.futile', 'zoom.pinch', 'menu.context', 'tap.rage',
  'scroll.skim', 'scroll.read', 'scroll.reverse', 'scroll.bottom',
  'scroll.top.return', 'scroll.overscroll', 'scroll.stall', 'scroll.none',
  'text.select', 'text.copy', 'text.cut', 'text.paste', 'select.all',
  'focus.keyboardnav', 'input.focus', 'input.hesitation', 'input.deleted',
  'input.submit.name', 'input.submit.empty',
  'tab.hide', 'tab.show', 'idle.30', 'idle.120', 'idle.600', 'active.return',
  'orient.change', 'resize.keyboard', 'resize.viewport',
  'net.offline', 'net.online',
  'env.time', 'env.scheme', 'env.reducedMotion', 'env.language',
  'env.connection', 'env.memory', 'env.referral', 'env.battery', 'env.incognito',
  'nav.back', 'nav.back.free', 'page.reload', 'devtools.open', 'page.404',
  'space.close', 'visit.return', 'visit.first', 'memory.discrepancy',
  'console.hello', 'console.snoop', 'phase.enter', 'permission.denied',
];

// One silent catch-all per event type. Priority 0: everything beats it.
const silentFloor = SILENT_TYPES.map((t) => ({
  id: `fallback.silent.${t}`,
  on: t,
  priority: 0,
  silent: true,
  note: 'floor of the fallback tier: observed, counted, deliberately unremarked',
}));

// --- EXAMPLE RULES (the template ten) --------------------------------
const examples = [
  {
    // 1: a simple once-ever line gated to a phase range
    id: 'fallback.ex.first-dead-tap',
    on: 'tap.dead',
    phase: [2, 3],
    priority: 12,
    once: true,
    say: 'You tapped a part of the page with nothing in it. I don’t have a metric for that. I wrote one down anyway.',
    mood: 'curious',
  },
  {
    // 2: escalation via say-array (fire 1 -> [0], fire 2 -> [1], …)
    id: 'fallback.ex.generic-longpress',
    on: 'press.long',
    phase: [2, 4],
    priority: 8,
    maxFires: 3,
    cooldown: 90,
    say: [
      'You held that down for a while. It doesn’t do anything. I appreciated it anyway.',
      'Holding it again. Is this how you pet a website. I’m asking sincerely.',
      'Noted. You’re a holder. It’s in the profile now.',
    ],
    mood: 'curious',
    effect: (ctx) => ctx.disposition({ curiosity: 1 }),
  },
  {
    // 3: random-variant fallback with a chance gate so it stays rare
    id: 'fallback.ex.generic-tap',
    on: 'tap',
    phase: [2, 3],
    priority: 2,
    chance: 0.06,
    cooldown: 120,
    say: {
      pick: [
        'Logged.',
        'Noted.',
        'That one’s going in the session summary.',
      ],
    },
    mood: 'flat',
    note: 'rare generic acknowledgment; specific tap rules should almost always win',
  },
  {
    // 4: a `when` predicate reading counters
    id: 'fallback.ex.pinch-repeat',
    on: 'zoom.pinch',
    phase: [1, 4],
    priority: 15,
    maxFires: 1,
    when: (s) => (s.counters['zoom.pinch'] || 0) >= 2,
    say: 'The text is already the right size. What you’re looking for isn’t bigger.',
    mood: 'wary',
  },
  {
    // 5: template tokens
    id: 'fallback.ex.reload-count',
    on: 'page.reload',
    phase: [2, 4],
    priority: 6,
    cooldown: 30,
    chance: 0.5,
    say: 'Reload number {total}. I keep everything, you know.',
    mood: 'flat',
  },
  {
    // 6: effect-only rule (no dialogue): out-of-band channel
    id: 'fallback.ex.hidden-title-default',
    on: 'tab.hide',
    phase: [2, 4],
    priority: 1,
    effect: (ctx) => ctx.titleWhenHidden(['Loam — still here', 'Loam — take your time']),
    note: 'default tab-title whisper; presence content overrides with better ones',
  },
  {
    // 7: chosen silence WITH intent (differs from the floor: it nudges state)
    id: 'fallback.ex.polite-idle',
    on: 'idle.30',
    phase: [0, 1],
    priority: 4,
    silent: true,
    effect: (ctx) => ctx.disposition({ patience: 1 }),
    note: 'early idling reads as reading; bank it as patience, say nothing',
  },
  {
    // 8: phase.enter hook — content can react to act transitions
    id: 'fallback.ex.phase2-arrival',
    on: 'phase.enter',
    priority: 1,
    when: (s, ev) => ev.data?.phase === 2,
    silent: true,
    effect: (ctx) => ctx.favicon('awake'),
    note: 'the favicon wakes up when the voice does',
  },
  {
    // 9: generic environment acknowledgment, banked not spoken
    id: 'fallback.ex.env-bank',
    on: ['env.language', 'env.connection', 'env.memory'],
    priority: 1,
    silent: true,
    effect: (ctx, ev) => ctx.setFlag(`env.${ev.type.split('.')[1]}`, ev.data),
    note: 'stash environment reads in flags so later dialogue can quote them',
  },
  {
    // 10: low generic spoken fallback for an event family (rationed hard)
    id: 'fallback.ex.generic-select',
    on: 'text.select',
    phase: [2, 3],
    priority: 3,
    chance: 0.2,
    cooldown: 180,
    say: 'You can highlight anything you want. It’s all load-bearing.',
    mood: 'calm',
  },
];

export default [...silentFloor, ...examples];
