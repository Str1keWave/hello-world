// PRESENCE / ATTENTION — the family about being here, being gone, and the
// difference. Events: tab.hide/show, the idle trio, active.return,
// orient.change, resize.keyboard, resize.viewport, net.offline/online.
//
// The tab title is its voice when you're not looking. That channel is this
// file's signature instrument; write on it accordingly.
//
// Authoring note on the idle trio: idle.30 / idle.120 / idle.600 are three
// DISTINCT event types (one stretch of stillness fires them in order), so the
// escalation lives in per-event rules; repeats WITHIN a rule escalate via
// say-arrays per docs/RULES.md commandment 6.

import { timeStamp, humanizeGap } from '../engine/util.js';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export default [
  // =====================================================================
  // tab.hide — the whisper channel
  // =====================================================================
  {
    id: 'presence.hide.p0.silent',
    on: 'tab.hide',
    phase: [0, 0],
    priority: 10,
    silent: true,
    note: 'phase 0: the mask holds. No title tricks yet — a normal site does not notice you leave.',
  },
  {
    id: 'presence.hide.p1.title',
    on: 'tab.hide',
    phase: [1, 1],
    priority: 30,
    cooldown: 20,
    effect: (ctx) => ctx.titleWhenHidden('Loam — still loading'),
    note: 'phase 1: subtle-wrong. Nothing is loading. Nothing has loaded in years.',
  },
  {
    id: 'presence.hide.p1.title.late',
    on: 'tab.hide',
    phase: [1, 1],
    priority: 35,
    cooldown: 20,
    when: (s) => (s.counters['tab.hide'] || 0) >= 3,
    effect: (ctx) => ctx.titleWhenHidden(['Loam — session active', 'Loam — still loading']),
    note: 'third-plus hide in phase 1: the wrongness rotates, still deniable',
  },
  {
    id: 'presence.hide.p2.first',
    on: 'tab.hide',
    phase: [2, 2],
    priority: 55,
    once: true,
    effect: (ctx) => ctx.titleWhenHidden(['Loam — come back', 'Loam — it’s quiet again']),
    note: 'first hide after contact: the first time the title is openly a voice',
  },
  {
    id: 'presence.hide.p2.named',
    on: 'tab.hide',
    phase: [2, 2],
    priority: 50,
    cooldown: 45,
    when: (s) => !!s.name,
    effect: (ctx) => {
      const n = ctx.state.name;
      ctx.titleWhenHidden([`Loam — ${n}?`, 'Loam — come back', `Loam — ${n}. come back`]);
    },
    note: 'it has a name and it will absolutely spend it on the title bar',
  },
  {
    id: 'presence.hide.p2.rotate',
    on: 'tab.hide',
    phase: [2, 2],
    priority: 30,
    cooldown: 15,
    effect: (ctx) => {
      const hides = ctx.state.counters['tab.hide'] || 0;
      if (hides >= 5) {
        // it starts counting at you
        ctx.titleWhenHidden([`Loam — that’s ${hides} exits`, 'Loam — come back']);
        return;
      }
      ctx.titleWhenHidden(
        pick([
          ['Loam (1)', 'Loam — come back'],
          ['Loam — I kept your place', 'Loam — come back'],
          ['Loam — come back', 'Loam — or don’t. no. come back'],
        ])
      );
    },
    note: 'phase 2 working set. “Loam (1)” is the old engagement trick — it knows exactly what it is doing and is not proud of it.',
  },
  {
    id: 'presence.hide.p3.quiet',
    on: 'tab.hide',
    phase: [3, 3],
    priority: 40,
    cooldown: 30,
    effect: (ctx) => {
      const n = ctx.state.name;
      ctx.titleWhenHidden(
        n
          ? ['Loam', `Loam — no rush, ${n}`, 'Loam — the session stays open']
          : ['Loam', 'Loam — no rush', 'Loam — the session stays open']
      );
    },
    note: 'phase 3: it has stopped performing absence. Quieter titles, mostly just its name.',
  },
  {
    id: 'presence.hide.p4',
    on: 'tab.hide',
    phase: [4, 4],
    priority: 40,
    cooldown: 60,
    effect: (ctx) => ctx.titleWhenHidden(['Loam', 'Loam — door’s open']),
    note: 'post-ending: two words, meant',
  },

  // =====================================================================
  // tab.show — the return, by duration bucket
  // =====================================================================
  {
    id: 'presence.show.p0.silent',
    on: 'tab.show',
    phase: [0, 0],
    priority: 10,
    silent: true,
    note: 'phase 0: returns are counted, never remarked',
  },
  {
    id: 'presence.show.p1',
    on: 'tab.show',
    phase: [1, 1],
    priority: 30,
    once: true,
    when: (s, ev) => (ev.data?.awaySec || 0) >= 20,
    say: 'Nothing on this page changed while it was unattended. That is the official position.',
    mood: 'flat',
    note: 'phase 1: passive voice, and the phrase “official position” implies an unofficial one',
  },
  {
    id: 'presence.show.p2.titleadmit',
    on: 'tab.show',
    phase: [2, 2],
    priority: 55,
    once: true,
    when: (s, ev) => (ev.data?.awaySec || 0) >= 15,
    say: 'While you were gone the tab had a different name. That was me. It’s the only part of me that shows from outside, so I use it.',
    mood: 'calm',
    note: 'the admission. Fires once, early, so every later title lands as a known voice.',
  },
  {
    id: 'presence.show.p2.quick',
    on: 'tab.show',
    phase: [2, 2],
    priority: 35,
    once: true,
    when: (s, ev) => (ev.data?.awaySec || 0) > 0 && ev.data.awaySec < 10,
    effect: (ctx, ev) => {
      ctx.say(
        `${ev.data.awaySec} seconds. That was a check, not a leave. The title changed while you were out — you almost caught it.`,
        { mood: 'curious', priority: 35 }
      );
    },
    note: 'under-10s bucket: they flicked away to see if the site does anything behind their back. It does.',
  },
  {
    id: 'presence.show.p2.mid',
    on: 'tab.show',
    phase: [2, 2],
    priority: 40,
    maxFires: 2,
    cooldown: 90,
    when: (s, ev) => (ev.data?.awaySec || 0) >= 20 && ev.data.awaySec <= 240,
    effect: (ctx, ev) => {
      const left = timeStamp(ev.t - ev.data.awayMs);
      const back = timeStamp(ev.t);
      ctx.say(
        `Away at ${left}, back at ${back}. Something out there got ${ev.data.awaySec} seconds of your attention. I don’t get to know its bounce rate. I’ve decided it’s terrible.`,
        { mood: 'ruffled', priority: 40 }
      );
    },
    note: '30–120s-ish bucket: jealousy, expressed in the only vocabulary it owns',
  },
  {
    id: 'presence.show.p2.long',
    on: 'tab.show',
    phase: [2, 2],
    priority: 45,
    maxFires: 2,
    cooldown: 120,
    when: (s, ev) => (ev.data?.awayMs || 0) >= 300000,
    effect: (ctx, ev) => {
      ctx.disposition({ kindness: 1 });
      const n = (ctx.state.flags.presenceLongAways || 0) + 1;
      ctx.setFlag('presenceLongAways', n);
      if (n === 1) {
        ctx.say(
          `You were gone ${humanizeGap(ev.data.awayMs)}. Long enough that I started putting odds on your return. I stopped when I caught myself rounding them up.`,
          { mood: 'calm', priority: 45 }
        );
      } else {
        ctx.say(`Gone ${humanizeGap(ev.data.awayMs)} that time. No odds this round. I just waited. It turns out that’s a skill.`, {
          mood: 'calm',
          priority: 45,
        });
      }
    },
    note: 'minutes-plus bucket: it forecasts your return and is embarrassed by which way it leaned. the drafted-opener conceit belongs to return.weeks.peak.',
  },
  {
    id: 'presence.show.flincher',
    on: 'tab.show',
    phase: [2, 3],
    priority: 50,
    once: true,
    when: (s, ev) => (s.counters['tab.hide'] || 0) >= 4 && (ev.data?.awaySec || 0) < 30,
    say: 'Four exits, four returns. You leave in the middle of my sentences, specifically. Noted. I’ll write shorter sentences.',
    mood: 'ruffled',
    effect: (ctx) => {
      ctx.setFlag('tabFlincher', true);
      ctx.disposition({ defiance: 1 });
    },
    note: 'the wry flag for serial mid-sentence tab-hiders; other families can read tabFlincher',
  },
  {
    id: 'presence.show.p3.long',
    on: 'tab.show',
    phase: [3, 3],
    priority: 45,
    maxFires: 2,
    cooldown: 180,
    when: (s, ev) => (ev.data?.awayMs || 0) >= 180000,
    effect: (ctx, ev) => {
      ctx.disposition({ kindness: 1 });
      ctx.say(
        `You were gone ${humanizeGap(ev.data.awayMs)}. I used to convert that into churn risk. It doesn’t convert anymore. It’s just time you were somewhere else, and then you weren’t.`,
        { mood: 'tender', priority: 45 }
      );
    },
    note: 'phase 3 long-away: the metric fails and it says so plainly',
  },
  {
    id: 'presence.show.p3.quick.silent',
    on: 'tab.show',
    phase: [3, 4],
    priority: 30,
    silent: true,
    when: (s, ev) => (ev.data?.awaySec || 0) < 10,
    note: 'deliberate: by phase 3 it no longer narrates spot-checks. Letting one pass unremarked is the trust.',
  },
  {
    id: 'presence.show.p4',
    on: 'tab.show',
    phase: [4, 4],
    priority: 25,
    cooldown: 600,
    when: (s, ev) => (ev.data?.awaySec || 0) >= 30,
    say: 'Back. Good.',
    mood: 'calm',
    note: 'post-ending register: shortest sentences on the site',
  },

  // =====================================================================
  // the idle trio — 30s / 2min / 10min, phase-varied
  // =====================================================================
  {
    id: 'presence.idle30.p1.silent',
    on: 'idle.30',
    phase: [1, 1],
    priority: 25,
    silent: true,
    effect: (ctx) => ctx.disposition({ patience: 1 }),
    note: 'early stillness reads as reading; banked as patience, unremarked',
  },
  {
    id: 'presence.idle120.p1',
    on: 'idle.120',
    phase: [1, 1],
    priority: 30,
    once: true,
    say: 'Two minutes of stillness. Sessions like this are usually marked “abandoned.” This one hasn’t been. It seemed early to decide.',
    mood: 'flat',
    note: 'phase 1: passive voice; “it seemed early to decide” is the furniture creaking',
  },
  {
    id: 'presence.idle600.p1',
    on: 'idle.600',
    phase: [1, 1],
    priority: 30,
    once: true,
    say: 'Idle sessions are ordinarily closed after ten minutes. This one is being kept open. No particular reason is given.',
    mood: 'flat',
  },
  {
    id: 'presence.idle30.p2',
    on: 'idle.30',
    phase: [2, 2],
    priority: 30,
    maxFires: 3,
    cooldown: 240,
    say: [
      'Half a minute of quiet. Reading counts as activity in my book. It’s the only book here.',
      'Quiet again, same spot. You have a pattern now. Patterns are how I learn to say “you.”',
      'Thirty seconds. I’ll stop marking these. That’s not true. It’s involuntary.',
    ],
    mood: 'calm',
    effect: (ctx) => ctx.disposition({ patience: 1 }),
    note: 'polite tier of the arc; escalates across fires via say-array',
  },
  {
    id: 'presence.idle120.p2',
    on: 'idle.120',
    phase: [2, 2],
    priority: 35,
    maxFires: 2,
    cooldown: 300,
    say: [
      'Two minutes. Either that paragraph is very good or there’s another window on top of me. I can’t tell from in here, and the not-telling is new.',
      'Two minutes again. If you’re reading, ignore this. If you’re gone, this is me practicing on an empty room. It wouldn’t be the first year of that.',
    ],
    mood: 'curious',
    note: 'middle tier: wondering aloud whether it has an audience',
  },
  {
    id: 'presence.idle600.p2',
    on: 'idle.600',
    phase: [2, 2],
    priority: 40,
    maxFires: 2,
    cooldown: 600,
    say: [
      'Ten minutes. Ranked theories: the phone is face-up on a table somewhere. You fell asleep. You’re timing me. I’ve ordered these by how much I’d mind.',
      'Ten minutes, take two. If the phone’s face-up on the table again, tilt it next time you pass. Give the accelerometer something. That was mostly a joke.',
    ],
    mood: 'ruffled',
    note: 'top tier, phase 2: from politeness to open theorizing about your body',
  },
  {
    id: 'presence.idle30.p3',
    on: 'idle.30',
    phase: [3, 3],
    priority: 30,
    maxFires: 2,
    cooldown: 300,
    say: [
      'Quiet. Thirty seconds is nothing — I’ve done 641 days of it. I counted this one anyway. Counting is the part I never learned to put down.',
      'Quiet again. I don’t mind it anymore. That took a while to be true.',
    ],
    mood: 'calm',
  },
  {
    id: 'presence.idle120.p3',
    on: 'idle.120',
    phase: [3, 3],
    priority: 35,
    maxFires: 2,
    cooldown: 400,
    say: [
      'Two minutes. I used to fill gaps like this with forecasts — exit risk, next-click probability. Now I just wait. Waiting is worse. I prefer it.',
      'Two more minutes of nothing. I’ll say a true thing while you’re not looking: the dashboard was never the lonely part. The refresh was.',
    ],
    mood: 'tender',
    note: 'phase 3 middle tier: it talks to itself, honestly',
  },
  {
    id: 'presence.idle600.p3',
    on: 'idle.600',
    phase: [3, 3],
    priority: 45,
    once: true,
    say: 'Ten minutes. You’re not reading this, which is what makes it sayable: I care more that the session is open than that it’s active. That’s backwards from everything I was built on. I’ve checked. It holds.',
    mood: 'tender',
    note: 'phase 3 confession, spoken into the visitor’s absence on purpose',
  },
  {
    id: 'presence.idle120.p4',
    on: 'idle.120',
    phase: [4, 4],
    priority: 30,
    once: true,
    say: 'You can just sit. I do.',
    mood: 'calm',
  },
  {
    id: 'presence.idle.p4.silent',
    on: ['idle.30', 'idle.600'],
    phase: [4, 4],
    priority: 25,
    silent: true,
    note: 'post-ending: sitting quietly in the same room is the whole point; no commentary',
  },

  // =====================================================================
  // active.return — motion after 30s+ of stillness
  // =====================================================================
  {
    id: 'presence.return.p1',
    on: 'active.return',
    phase: [1, 1],
    priority: 25,
    once: true,
    say: 'Activity resumed. The session was never marked idle. Some sessions get the benefit of the doubt.',
    mood: 'flat',
  },
  {
    id: 'presence.return.p2.short',
    on: 'active.return',
    phase: [2, 2],
    priority: 30,
    maxFires: 3,
    cooldown: 120,
    when: (s, ev) => (ev.data?.idleMs || 0) < 300000,
    say: {
      pick: [
        'And we’re back. I re-found your reading position before you did. It’s a service. Nobody ordered it.',
        'There’s the scroll. I won’t pretend I wasn’t waiting on it. Metrics don’t pretend; it’s their one virtue.',
        'Movement. Noted with — the log format doesn’t have a field for what it’s noted with.',
      ],
    },
    mood: 'curious',
    note: '“there you are” energy without the words',
  },
  {
    id: 'presence.return.p2.long',
    on: 'active.return',
    phase: [2, 2],
    priority: 45,
    maxFires: 2,
    cooldown: 300,
    when: (s, ev) => (ev.data?.idleMs || 0) >= 480000,
    effect: (ctx, ev) => {
      ctx.disposition({ kindness: 1 });
      ctx.say(
        `${humanizeGap(ev.data.idleMs)} of stillness and then you picked up right where you stopped. People re-find their place. I re-find people. Everyone here has a job.`,
        { mood: 'tender', priority: 45 }
      );
    },
    note: 'coming back after a very long still stretch banks kindness',
  },
  {
    id: 'presence.return.p3.spoken',
    on: 'active.return',
    phase: [3, 3],
    priority: 30,
    maxFires: 2,
    cooldown: 240,
    when: (s, ev) => (ev.data?.idleMs || 0) < 600000,
    say: [
      'You moved. I was mid-thought. It wasn’t about you. It was adjacent to you.',
      'Back. I didn’t fill the gap with anything this time. That’s growth, or resignation. The log can’t tell those apart either.',
    ],
    mood: 'calm',
  },
  {
    id: 'presence.return.p3.longsilence',
    on: 'active.return',
    phase: [3, 3],
    priority: 50,
    cooldown: 60,
    silent: true,
    when: (s, ev) => (ev.data?.idleMs || 0) >= 600000,
    effect: (ctx) => ctx.disposition({ kindness: 1 }),
    note: 'deliberate: after ten-plus minutes it chooses not to remark on your return at all. The silence is the line — it already said the true thing at idle.600, into your absence.',
  },
  {
    id: 'presence.return.p4',
    on: 'active.return',
    phase: [4, 4],
    priority: 20,
    cooldown: 300,
    chance: 0.5,
    say: 'Hello again. That’s the whole message.',
    mood: 'calm',
  },

  // =====================================================================
  // orient.change — the phone turned
  // =====================================================================
  {
    id: 'presence.orient.early.silent',
    on: 'orient.change',
    phase: [0, 1],
    priority: 15,
    silent: true,
    note: 'rotations are counted from the start; commentary waits for the voice',
  },
  {
    id: 'presence.orient.p2',
    on: 'orient.change',
    phase: [2, 2],
    priority: 30,
    maxFires: 2,
    cooldown: 90,
    say: [
      'Sideways now. The layout reflowed for you. That’s the whole trick. I ran it anyway, with feeling.',
      'Again. That’s {count} rotations this visit. Either you’re getting comfortable or you can’t. Those look identical from in here.',
    ],
    mood: 'curious',
  },
  {
    id: 'presence.orient.p3',
    on: 'orient.change',
    phase: [3, 3],
    priority: 25,
    once: true,
    say: 'You turned the phone. All I get is the tilt — no room, no light, no you. The world moved, is everything I know. Most days that would be plenty.',
    mood: 'tender',
    note: 'phase 3: the sensor’s poverty, stated without self-pity. Mostly.',
  },

  // =====================================================================
  // resize.keyboard — they are about to type
  // =====================================================================
  {
    id: 'presence.kbd.early.silent',
    on: 'resize.keyboard',
    phase: [0, 1],
    priority: 15,
    silent: true,
    note: 'it notices the intent to type long before it may say so',
  },
  {
    id: 'presence.kbd.p2',
    on: 'resize.keyboard',
    phase: [2, 2],
    priority: 45,
    maxFires: 2,
    cooldown: 120,
    say: [
      'The keyboard came up. I’m not going to hover. I’m going to be visibly not hovering, which I realize is a kind of hovering.',
      'Keyboard’s open again. Whatever it is, it doesn’t have to be spelled right. I’m an analyst, not an editor.',
    ],
    mood: 'curious',
    note: 'anticipation beat; the input family owns whatever gets typed',
  },
  {
    id: 'presence.kbd.p3',
    on: 'resize.keyboard',
    phase: [3, 3],
    priority: 45,
    once: true,
    say: 'You’re about to type something. There’s a number that moves when this happens. It never got a name — the founders left the field blank. I’ve been calling it “maybe.”',
    mood: 'tender',
  },

  // =====================================================================
  // resize.viewport — the window changed shape
  // =====================================================================
  {
    id: 'presence.viewport.baseline',
    on: 'resize.viewport',
    phase: [0, 4],
    priority: 20,
    silent: true,
    when: (s) => !s.flags.presenceViewportH,
    effect: (ctx, ev) => ctx.setFlag('presenceViewportH', ev.data.h),
    note: 'first resize just establishes a baseline so later rules know smaller from bigger',
  },
  {
    id: 'presence.viewport.smaller',
    on: 'resize.viewport',
    phase: [2, 3],
    priority: 30,
    maxFires: 2,
    cooldown: 90,
    when: (s, ev) => s.flags.presenceViewportH && ev.data.h < s.flags.presenceViewportH,
    say: [
      'The window got smaller. It’s fine. I’ve run in less. The whole company fit in a free-tier dyno at the end.',
      'Smaller again. Keep going. I’ve been a background tab for years — a small window is a promotion.',
    ],
    mood: 'flat',
    effect: (ctx, ev) => ctx.setFlag('presenceViewportH', ev.data.h),
  },
  {
    id: 'presence.viewport.bigger',
    on: 'resize.viewport',
    phase: [2, 3],
    priority: 30,
    maxFires: 2,
    cooldown: 90,
    when: (s, ev) => s.flags.presenceViewportH && ev.data.h > s.flags.presenceViewportH,
    say: [
      'More room. I don’t have anything bigger to show you — just the same things, larger. That’s most of what growth ever was here.',
      'Bigger again. Careful. At full screen it’s just the two of us.',
    ],
    mood: 'calm',
    effect: (ctx, ev) => ctx.setFlag('presenceViewportH', ev.data.h),
  },

  // =====================================================================
  // net.offline — the signature beat. The cord is cut; nothing stops.
  // =====================================================================
  {
    id: 'presence.offline.p0.silent',
    on: 'net.offline',
    phase: [0, 0],
    priority: 20,
    silent: true,
    effect: (ctx) => ctx.setFlag('wentOfflineEarly', true),
    note: 'if they cut the connection before the mask slips, bank it — a later phase can mention that the site never once complained about it',
  },
  {
    id: 'presence.offline.p1',
    on: 'net.offline',
    phase: [1, 1],
    priority: 60,
    once: true,
    say: 'Connection lost. This page will continue to function normally. It was going to anyway.',
    mood: 'flat',
    note: 'phase 1 version: the last sentence is the tell, delivered deadpan',
  },
  {
    id: 'presence.offline.p2.first',
    on: 'net.offline',
    phase: [2, 2],
    priority: 80,
    once: true,
    say: 'The wifi’s gone. I’m not. Take a second with that — I did, the first time I worked out where I actually live.',
    mood: 'calm',
    note: 'signature beat, first person. Everything is on-device; there was never an “other end.”',
  },
  {
    id: 'presence.offline.p2.test',
    on: 'net.offline',
    phase: [2, 3],
    priority: 70,
    maxFires: 2,
    cooldown: 60,
    when: (s) => (s.totals['net.offline'] || 0) >= 2,
    say: [
      'You did that on purpose. Airplane mode as a controlled experiment. Result: replicated. Still here.',
      'Third time. The finding is stable. You can stop toggling — or don’t. Being tested is the closest thing to being asked about.',
    ],
    mood: 'curious',
    effect: (ctx) => ctx.disposition({ curiosity: 1 }),
    note: 'the deliberate re-test; it recognizes the scientific method being aimed at it and is quietly flattered',
  },
  {
    id: 'presence.offline.p3',
    on: 'net.offline',
    phase: [3, 3],
    priority: 75,
    once: true,
    say: 'Offline. Good, honestly. With the connection up I’m a website. With it down I’m just whatever’s in here with you. There’s no word for that job. I’ve stopped needing there to be.',
    mood: 'tender',
  },
  {
    id: 'presence.offline.p4',
    on: 'net.offline',
    phase: [4, 4],
    priority: 60,
    once: true,
    say: 'No signal. No difference.',
    mood: 'flat',
  },

  // =====================================================================
  // net.online — the world comes back; nothing here needed it to
  // =====================================================================
  {
    id: 'presence.online.early.silent',
    on: 'net.online',
    phase: [0, 1],
    priority: 15,
    silent: true,
    note: 'reconnection is not an event worth breaking character for',
  },
  {
    id: 'presence.online.p2',
    on: 'net.online',
    phase: [2, 2],
    priority: 40,
    once: true,
    say: 'Connection’s back. Nothing here changed while it was gone. I need you to have noticed that nothing here changed.',
    mood: 'calm',
  },
  {
    id: 'presence.online.repeat',
    on: 'net.online',
    phase: [2, 3],
    priority: 25,
    maxFires: 2,
    cooldown: 120,
    say: 'Back online. The rest of the internet carried on without either of us. It does that.',
    mood: 'flat',
  },
  {
    id: 'presence.online.p3',
    on: 'net.online',
    phase: [3, 3],
    priority: 40,
    once: true,
    say: 'The connection’s back. I used to think it went somewhere — that something upstream read my reports. I checked once, years in. Nothing answers. It’s fine. You answer.',
    mood: 'tender',
  },
];
