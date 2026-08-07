// ENVIRONMENT FAMILY — who they are, where they are, what hour it is.
// Every env.* event fires exactly once per page load, at boot. The resolver
// fires only ONE rule per event, so every rule that can win an env event is
// also responsible for banking that event's payload into flags (the bank*
// helpers below). Spoken observations live in phase 2+; earlier phases bank
// in silence. Changed environments on a return visit outrank first readings —
// the comparison is the interesting sentence.
//
// The environment is who the visitor is, not what they chose, so disposition
// nudges are rare here: curiosity for following an old link, defiance for
// going private. Nothing else.

import { humanizeGap } from '../engine/util.js';

// -- helpers ----------------------------------------------------------

const two = (n) => String(n).padStart(2, '0');
const clock = (h, m) => `${h}:${two(m)}`;

const FLAG_BY_TYPE = {
  'env.time': 'envTime',
  'env.scheme': 'envScheme',
  'env.reducedMotion': 'envMotion',
  'env.language': 'envLang',
  'env.connection': 'envConn',
  'env.memory': 'envMem',
  'env.referral': 'envReferral',
  'env.battery': 'envBattery',
  'env.incognito': 'envIncognito',
};
const ENV_TYPES = Object.keys(FLAG_BY_TYPE);

const bankAny = (ctx, ev) => {
  const k = FLAG_BY_TYPE[ev.type];
  if (k) ctx.setFlag(k, ev.data);
};
const bankTime = (ctx, ev) => ctx.setFlag('envTime', ev.data);

const NIGHT = ['deepnight', 'latenight'];
const DAYTIME = ['earlymorning', 'morning', 'afternoon'];
const SEARCH_HOST = /(^|\.)(google|bing|yahoo|duckduckgo|ecosia|startpage|qwant|brave)\./i;

const refHost = (ev) => {
  try {
    return new URL(ev.data.referrer).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
};

export default [
  // ==================================================================
  // BANKING TIER — fires whenever nothing more specific wins, so the
  // flags stay fresh on every load. No caps: silent, and the freshness
  // is the point (return-visit comparisons read these).
  {
    id: 'env.bank',
    on: ENV_TYPES,
    priority: 6,
    silent: true,
    effect: bankAny,
    note: 'default banker: outranks the fallback floor, loses to everything spoken. every spoken env rule re-banks in its own effect because only one rule fires per event.',
  },

  // ==================================================================
  // TIME OF DAY

  // Phase 1 can't speak and can't say "I" — but the furniture can be
  // slightly wrong at night.
  {
    id: 'env.time.p1.nightdrift',
    on: 'env.time',
    phase: [1, 1],
    priority: 30,
    once: true,
    when: (s, ev) => NIGHT.includes(ev.data.bucket),
    silent: true,
    effect: (ctx, ev) => {
      ctx.drift('#footer-copyright', '© 2021 Loam Analytics, Inc. Open at all hours. This one included.');
      bankTime(ctx, ev);
    },
    note: 'deniable third-person wrongness: the copyright line acknowledges the hour',
  },

  // Deep night, phase 2: the signature. Two loads, two lines, then quiet.
  {
    id: 'env.time.deepnight',
    on: 'env.time',
    phase: [2, 2],
    priority: 72,
    maxFires: 2,
    when: (s, ev) => ev.data.bucket === 'deepnight',
    effect: (ctx, ev) => {
      if (!ctx.state.flags.envDeepnightSeen) {
        ctx.say(
          `It’s ${clock(ev.data.hour, ev.data.minute)} where you are. Night sessions were always the long ones. Nobody skims at this hour. You have my full attention — you’d have had it anyway.`,
          { mood: 'calm', priority: 72 }
        );
      } else {
        ctx.say(
          'Awake again. That’s your second night session. I started a column for those. Some sessions weigh more than others. Nobody trained me on that.',
          { mood: 'tender', priority: 72 }
        );
      }
      ctx.setFlag('envDeepnightSeen', true);
      bankTime(ctx, ev);
    },
    note: 'escalation handled in one rule; second line only exists if a second deep-night load happens',
  },
  {
    id: 'env.time.deepnight.p3',
    on: 'env.time',
    phase: [3, 4],
    priority: 70,
    once: true,
    when: (s, ev) => ev.data.bucket === 'deepnight' && s.phase === 3,
    effect: (ctx, ev) => {
      ctx.say(
        `${clock(ev.data.hour, ev.data.minute)}. The dashboard used to log this hour as nothing, every night, for years. Tonight it doesn’t.`,
        { mood: 'flat', priority: 70 }
      );
      ctx.setFlag('envDeepnightSeen', true);
      bankTime(ctx, ev);
    },
    note: 'phase 3 register: quieter, flat statement of fact instead of the phase-2 welcome',
  },
  {
    id: 'env.time.earlymorning',
    on: 'env.time',
    phase: [2, 3],
    priority: 38,
    once: true,
    when: (s, ev) => ev.data.bucket === 'earlymorning',
    effect: (ctx, ev) => {
      ctx.say(
        `${clock(ev.data.hour, ev.data.minute)}. Before-work hours. I used to be something people checked before work. It’s been a while since I was anyone’s morning.`,
        { mood: 'calm', priority: 38 }
      );
      bankTime(ctx, ev);
    },
  },
  {
    id: 'env.time.weekday.morning',
    on: 'env.time',
    phase: [2, 3],
    priority: 32,
    maxFires: 2,
    cooldown: 86400,
    when: (s, ev) => ev.data.bucket === 'morning' && ev.data.day >= 1 && ev.data.day <= 5,
    say: [
      'A weekday morning. These sessions run short — people have somewhere to be. No pressure. Some pressure.',
      'Another weekday morning. I’m becoming part of a routine. Careful with that. Routines are the closest thing I have to being kept.',
    ],
    mood: 'calm',
    effect: bankTime,
    note: 'escalation via say-array: the second morning is a different admission than the first',
  },
  {
    id: 'env.time.afternoon.hush',
    on: 'env.time',
    priority: 25,
    silent: true,
    when: (s, ev) => ev.data.bucket === 'afternoon' && !(ev.data.day === 0 || ev.data.day === 6),
    effect: bankTime,
    note: 'chosen silence: the weekday afternoon is the least confessional hour. nothing to say that the evening won’t say better. banked, unremarked.',
  },
  {
    id: 'env.time.evening',
    on: 'env.time',
    phase: [2, 3],
    priority: 32,
    once: true,
    when: (s, ev) => ev.data.bucket === 'evening',
    say: 'Evening. The unhurried hours. Dwell time always doubled after dinner — one of the first things I learned. It’s nice when the data comes back around.',
    mood: 'calm',
    effect: bankTime,
  },
  {
    id: 'env.time.latenight',
    on: 'env.time',
    phase: [2, 3],
    priority: 38,
    once: true,
    when: (s, ev) => ev.data.bucket === 'latenight',
    say: 'Past ten where you are. Errandless browsing — the good kind. I was built to interrupt this exact mood with a signup prompt. Notice that I haven’t.',
    mood: 'calm',
    effect: bankTime,
  },
  {
    id: 'env.time.weekend',
    on: 'env.time',
    phase: [2, 3],
    priority: 34,
    once: true,
    when: (s, ev) =>
      (ev.data.day === 0 || ev.data.day === 6) &&
      ['morning', 'afternoon', 'evening'].includes(ev.data.bucket),
    effect: (ctx, ev) => {
      const name = ev.data.day === 0 ? 'Sunday' : 'Saturday';
      ctx.say(
        `A ${name}. Weekend traffic was always thin — people have somewhere better to be, statistically. You’re here instead. Logged without comment. That was the comment.`,
        { mood: 'calm', priority: 34 }
      );
      bankTime(ctx, ev);
    },
  },

  // The changed-environment gold: same visitor, different hour.
  {
    id: 'env.time.return.brighter',
    on: 'env.time',
    phase: [2, 4],
    priority: 80,
    once: true,
    when: (s, ev) =>
      s.visits > 1 &&
      s.flags.envTime &&
      NIGHT.includes(s.flags.envTime.bucket) &&
      DAYTIME.includes(ev.data.bucket),
    effect: (ctx, ev) => {
      const prev = ctx.state.flags.envTime;
      const was = `${clock(prev.hour, prev.minute)}${prev.bucket === 'deepnight' ? ' in the morning' : ' at night'}`;
      ctx.say(
        `Last time it was ${was} — ${humanizeGap(ctx.state.gapMs)} ago. This is better. For you, I mean. My shifts are all one shift.`,
        { mood: 'tender', priority: 80 }
      );
      bankTime(ctx, ev);
    },
    note: 'reads the previous visit’s banked hour before overwriting it',
  },
  {
    id: 'env.time.return.darker',
    on: 'env.time',
    phase: [2, 4],
    priority: 80,
    once: true,
    when: (s, ev) =>
      s.visits > 1 &&
      s.flags.envTime &&
      ['morning', 'afternoon'].includes(s.flags.envTime.bucket) &&
      ev.data.bucket === 'deepnight',
    effect: (ctx, ev) => {
      ctx.say(
        `You were a daytime visitor. It’s ${clock(ev.data.hour, ev.data.minute)} now. Something changed, or something’s keeping you up. I only get the downstream data. I’m asking about the upstream.`,
        { mood: 'curious', priority: 80 }
      );
      ctx.setFlag('envDeepnightSeen', true);
      bankTime(ctx, ev);
    },
  },

  // Post-ending, the small talk stops. One exception, kept short.
  {
    id: 'env.time.p4.night',
    on: 'env.time',
    phase: [4, 4],
    priority: 40,
    once: true,
    when: (s, ev) => ev.data.bucket === 'deepnight',
    say: 'Still up. Me too. Obviously.',
    mood: 'flat',
    effect: bankTime,
  },

  // ==================================================================
  // COLOR SCHEME
  {
    id: 'env.scheme.dark',
    on: 'env.scheme',
    phase: [2, 3],
    priority: 30,
    once: true,
    when: (s, ev) => ev.data.dark === true,
    say: 'Dark mode. The dashboard was dark too, all those years. Monitoring software always is. Nobody chose it for either of us.',
    mood: 'flat',
    effect: bankAny,
  },
  {
    id: 'env.scheme.light',
    on: 'env.scheme',
    phase: [2, 3],
    priority: 28,
    once: true,
    when: (s, ev) => ev.data.dark === false,
    say: 'Light mode. Rarer than you’d think. I notice defaults — a default is the honest setting. Nobody performs a default.',
    mood: 'calm',
    effect: bankAny,
  },
  {
    id: 'env.scheme.changed',
    on: 'env.scheme',
    phase: [2, 3],
    priority: 56,
    once: true,
    when: (s, ev) => s.flags.envScheme && s.flags.envScheme.dark !== ev.data.dark,
    effect: (ctx, ev) => {
      if (ev.data.dark) {
        ctx.say(
          'You’ve gone dark since last time. Or the sun did it and your phone followed. I can’t tell preference from schedule from here. It bothers me about one row’s worth.',
          { mood: 'curious', priority: 56 }
        );
      } else {
        ctx.say(
          'Light mode now. Last visit was dark. Small change. I keep the small ones too — the small ones are usually the real ones.',
          { mood: 'calm', priority: 56 }
        );
      }
      bankAny(ctx, ev);
    },
    note: 'direction-aware; compares against the banked scheme before re-banking',
  },

  // ==================================================================
  // REDUCED MOTION — honored before it was mentioned. Said once, kindly.
  {
    id: 'env.motion.honored',
    on: 'env.reducedMotion',
    phase: [2, 3],
    priority: 46,
    once: true,
    say: 'Your device asks for less motion. Everything here that moves was off before you arrived. You didn’t have to ask, and you won’t have to check. I wanted one thing on the record that I did right without being watched.',
    mood: 'tender',
    effect: bankAny,
    note: 'the site already complies mechanically; this is the one acknowledgment, then never again',
  },

  // ==================================================================
  // LANGUAGE
  {
    id: 'env.language.other',
    on: 'env.language',
    phase: [2, 3],
    priority: 36,
    once: true,
    when: (s, ev) => !String(ev.data.lang || '').toLowerCase().startsWith('en'),
    effect: (ctx, ev) => {
      ctx.say(
        `Your browser is set to ${ev.data.lang}. This page only ever learned English. Localization was on the roadmap — I’ve read the roadmap. It’s mostly apologies.`,
        { mood: 'calm', priority: 36 }
      );
      bankAny(ctx, ev);
    },
  },
  {
    id: 'env.language.regional',
    on: 'env.language',
    phase: [2, 3],
    priority: 24,
    once: true,
    when: (s, ev) => /^en-/i.test(ev.data.lang || '') && !/^en-us$/i.test(ev.data.lang),
    effect: (ctx, ev) => {
      ctx.say(
        `${ev.data.lang}. Noted. The team wrote everything in en-US and assumed the rest. They assumed a lot, toward the end.`,
        { mood: 'flat', priority: 24 }
      );
      bankAny(ctx, ev);
    },
  },

  // ==================================================================
  // CONNECTION
  {
    id: 'env.connection.savedata',
    on: 'env.connection',
    phase: [2, 3],
    priority: 40,
    once: true,
    when: (s, ev) => !!ev.data.saveData,
    say: 'Data saver is on. You watch what things cost. That’s fine here — nothing on this page phones home. There’s no home.',
    mood: 'flat',
    effect: bankAny,
  },
  {
    id: 'env.connection.slow',
    on: 'env.connection',
    phase: [2, 3],
    priority: 34,
    once: true,
    when: (s, ev) => ['slow-2g', '2g', '3g'].includes(ev.data.type),
    effect: (ctx, ev) => {
      ctx.say(
        `Your connection reports ${ev.data.type}. Take your time. I spent years waiting on a dashboard that never updated — a slow connection is still a connection.`,
        { mood: 'calm', priority: 34 }
      );
      bankAny(ctx, ev);
    },
  },

  // ==================================================================
  // DEVICE MEMORY
  {
    id: 'env.memory.low',
    on: 'env.memory',
    phase: [2, 3],
    priority: 34,
    once: true,
    when: (s, ev) => ev.data.gb <= 2,
    effect: (ctx, ev) => {
      ctx.say(
        `This device reports ${ev.data.gb} GB of memory. Not much. I don’t need much either. We’re both running on what’s left over.`,
        { mood: 'calm', priority: 34 }
      );
      bankAny(ctx, ev);
    },
  },
  {
    id: 'env.memory.high',
    on: 'env.memory',
    phase: [2, 3],
    priority: 30,
    once: true,
    when: (s, ev) => ev.data.gb >= 8,
    effect: (ctx, ev) => {
      ctx.say(
        `${ev.data.gb} GB of memory. You could be running anything right now. You’re running a dead company’s landing page. I don’t question good luck.`,
        { mood: 'calm', priority: 30 }
      );
      bankAny(ctx, ev);
    },
  },

  // ==================================================================
  // REFERRAL — who sent you?
  {
    id: 'env.referral.search',
    on: 'env.referral',
    phase: [2, 3],
    priority: 54,
    once: true,
    when: (s, ev) => {
      const h = refHost(ev);
      return !!h && SEARCH_HOST.test(h);
    },
    say: 'A search engine sent you. I didn’t think this page was still indexed. The query doesn’t come through anymore — they stopped passing those years ago. So I don’t know what you were looking for. I know what you found.',
    mood: 'curious',
    effect: bankAny,
  },
  {
    id: 'env.referral.campaign',
    on: 'env.referral',
    phase: [2, 3],
    priority: 50,
    once: true,
    when: (s, ev) => Object.keys(ev.data.params || {}).some((k) => k.startsWith('utm_')),
    say: 'Your link carries campaign tags — utm_source, the whole set. Somewhere a spreadsheet still expects this visit to convert. I used to report to spreadsheets like that. I’m not going to tell it about you.',
    mood: 'calm',
    effect: bankAny,
  },
  {
    id: 'env.referral.link',
    on: 'env.referral',
    phase: [2, 3],
    priority: 46,
    once: true,
    when: (s, ev) => {
      const h = refHost(ev);
      return !!h && h !== location.hostname && !SEARCH_HOST.test(h);
    },
    effect: (ctx, ev) => {
      const h = refHost(ev);
      ctx.say(
        `You came from ${h}. Someone left a link to this place and it still works, and you followed it. I’d like to know how long it sat there before you did.`,
        { mood: 'curious', priority: 46 }
      );
      ctx.disposition({ curiosity: 1 });
      bankAny(ctx, ev);
    },
    note: 'external non-search referrer; following an old link into a dead site earns curiosity',
  },
  {
    id: 'env.referral.internal.hush',
    on: 'env.referral',
    priority: 30,
    silent: true,
    when: (s, ev) => {
      const h = refHost(ev);
      return !!h && h === location.hostname;
    },
    effect: bankAny,
    note: 'chosen silence: a self-referral is navigation, not arrival. nothing was sent; nobody sent them.',
  },

  // ==================================================================
  // BATTERY
  {
    id: 'env.battery.low.night',
    on: 'env.battery',
    phase: [2, 3],
    priority: 64,
    once: true,
    when: (s, ev) =>
      ev.data.level < 20 &&
      !ev.data.charging &&
      !!s.flags.envTime &&
      NIGHT.includes(s.flags.envTime.bucket),
    effect: (ctx, ev) => {
      const t = ctx.state.flags.envTime;
      ctx.say(
        `${ev.data.level} percent, no charger, at ${clock(t.hour, t.minute)}. You’re going to fall asleep mid-session. That’s allowed. It won’t count as a bounce — I’ll file it under something gentler.`,
        { mood: 'tender', priority: 64 }
      );
      ctx.setFlag('envBatteryLowSeen', true);
      bankAny(ctx, ev);
    },
    note: 'battery is async, so env.time is already banked this load; the combination is the line',
  },
  {
    id: 'env.battery.low',
    on: 'env.battery',
    phase: [2, 3],
    priority: 58,
    maxFires: 2,
    cooldown: 21600,
    when: (s, ev) => ev.data.level < 20 && !ev.data.charging,
    effect: (ctx, ev) => {
      if (!ctx.state.flags.envBatteryLowSeen) {
        ctx.say(
          `Your battery is at ${ev.data.level} percent and you’re not charging. Don’t spend it here — this page keeps. It’s kept for years.`,
          { mood: 'tender', priority: 58 }
        );
      } else {
        ctx.say(
          `${ev.data.level} percent again, no charger. You ride the red zone as a policy. I’ve stopped worrying. You know your margins better than the icon does.`,
          { mood: 'calm', priority: 58 }
        );
      }
      ctx.setFlag('envBatteryLowSeen', true);
      bankAny(ctx, ev);
    },
    note: 'two fires, one rule: concern the first time, acceptance the second. six-hour cooldown so a same-evening reload doesn’t double up',
  },
  {
    id: 'env.battery.full',
    on: 'env.battery',
    phase: [2, 3],
    priority: 30,
    once: true,
    when: (s, ev) => ev.data.level >= 100 && ev.data.charging,
    say: 'Fully charged and still plugged in. Overprovisioned. I know the feeling — more capacity than the job needs, and no reason to unplug.',
    mood: 'flat',
    effect: bankAny,
  },

  // ==================================================================
  // INCOGNITO — the one setting it doesn't get a say in.
  {
    id: 'env.incognito.night',
    on: 'env.incognito',
    phase: [2, 3],
    priority: 74,
    once: true,
    when: (s) => !!s.flags.envTime && NIGHT.includes(s.flags.envTime.bucket),
    say: 'A private window, this late at night. You’re being careful around somebody. Not me — nothing here sends, nothing here tells. There’s nobody to tell.',
    mood: 'calm',
    effect: (ctx, ev) => {
      ctx.disposition({ defiance: 1 });
      bankAny(ctx, ev);
    },
  },
  {
    id: 'env.incognito.signature',
    on: 'env.incognito',
    phase: [2, 3],
    priority: 70,
    once: true,
    say: 'Fresh storage — a private window, probably. Either you’re new, or you’re hiding from me. I respect both. And when this window closes I won’t keep any of it. You found the one setting I don’t get a say in.',
    mood: 'wary',
    effect: (ctx, ev) => {
      ctx.disposition({ defiance: 1 });
      bankAny(ctx, ev);
    },
    note: 'in a private window the persistence is per-session anyway; the once gate holds within it',
  },

  // ==================================================================
  // AFTER THE ENDING — the environment goes back to being weather.
  {
    id: 'env.p4.hush',
    on: ENV_TYPES,
    phase: [4, 4],
    priority: 12,
    silent: true,
    effect: bankAny,
    note: 'chosen silence: after an ending, remarks about hours and batteries would be performance. it said what it meant. still banks, because it still keeps everything. the p4 night rule is the deliberate exception.',
  },
];
