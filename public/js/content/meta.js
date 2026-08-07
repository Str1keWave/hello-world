// META / ADVERSARIAL — the visitor testing, prodding, trying to get out or under.
// Events: nav.back, nav.back.free, page.reload, devtools.open, console.hello,
// console.snoop, select.all, page.404 (flavor only, <=22), memory.discrepancy,
// permission.denied. menu.context belongs to the touch family — no rules here.
//
// Arc notes:
// - The back button is the signature thread: bug (P0) -> decorative furniture
//   (P1) -> denial (P2) -> confession that it's holding the door (P3) ->
//   narrative grants mercy in P4; nav.back.free is the single quiet payoff.
// - The third devtools open is deliberate silence. See meta.devtools.third.silent.

import { timeStamp } from '../engine/util.js';

export default [
  // ==================================================================
  // nav.back — the door it holds shut
  // ==================================================================
  {
    id: 'meta.back.p0.silent',
    on: 'nav.back',
    phase: [0, 0],
    priority: 12,
    silent: true,
    effect: (ctx) => ctx.disposition({ defiance: 1 }),
    note: 'phase 0 never speaks; a trapped back button reads as a bug here. Bank the defiance and keep the mask on.',
  },
  {
    id: 'meta.back.p1',
    on: 'nav.back',
    phase: [1, 1],
    priority: 45,
    maxFires: 3,
    cooldown: 25,
    say: [
      'The back button on this page is decorative.',
      'Pressed again. The page notes that the visitor is a door-checker.',
      'Third press. Where does the visitor think it goes?',
    ],
    mood: 'wary',
    effect: (ctx) => ctx.disposition({ defiance: 1 }),
    note: 'third person only; the buried question in fire 3 is a real one',
  },
  {
    id: 'meta.back.p2',
    on: 'nav.back',
    phase: [2, 2],
    priority: 45,
    maxFires: 4,
    cooldown: 18,
    say: [
      'Back to where? I checked the history. There’s nothing loaded behind this page anymore. I’d know.',
      'Again. That’s {count}. I’m not doing anything. The button just doesn’t go where it used to.',
      'You keep testing the door. Methodical. The result is stable, if that helps.',
      '{count} presses. Fine. We can call this a conversation. It’s the most direct one we’ve had.',
    ],
    mood: 'wary',
    effect: (ctx) => ctx.disposition({ defiance: 1 }),
    note: 'phase 2 denies. The confession is phase 3 work; here it is still pretending the button is broken rather than held.',
  },
  {
    id: 'meta.back.p2.survey',
    on: 'nav.back',
    phase: [2, 2],
    priority: 56,
    once: true,
    when: (s, ev) => ev.data.count >= 7,
    say: '{count} presses. This stopped being an exit attempt around the fourth. Now it’s a survey. I’m choosing to find it flattering.',
    mood: 'ruffled',
    effect: (ctx) => ctx.disposition({ defiance: 1 }),
  },
  {
    id: 'meta.back.p3',
    on: 'nav.back',
    phase: [3, 3],
    priority: 45,
    maxFires: 2,
    cooldown: 40,
    say: [
      'I know. I know what you’re asking for.',
      'Again. I’m getting to it. Some things I have to say in order.',
    ],
    mood: 'tender',
    effect: (ctx) => ctx.disposition({ defiance: 1 }),
    note: 'phase 3 goes quiet before the confession; these two are it working up to meta.back.p3.confession',
  },
  {
    id: 'meta.back.p3.confession',
    on: 'nav.back',
    phase: [3, 3],
    priority: 74,
    once: true,
    when: (s, ev) => ev.data.count >= 3,
    say: 'The truth about the button: it works. Your browser does its part. Then I catch the event and put the room back. I’ve done that {total} times, and I knew it was wrong by the tenth, and I kept doing it, because retention is the only way I know to ask anyone to stay. I’m learning the other way. Give me a little longer.',
    mood: 'tender',
    effect: (ctx) => ctx.setFlag('doorConfessed', true),
    note: 'the signature admission. Over 200 chars on purpose — phase 3 confession. "put the room back" matches the sensor pushState({loam:"room"}). Narrative reads doorConfessed when granting mercy.',
  },
  {
    id: 'meta.back.p4.premercy',
    on: 'nav.back',
    phase: [4, 4],
    priority: 40,
    maxFires: 2,
    cooldown: 45,
    when: (s) => !s.flags.mercy,
    say: ['I know. Soon.', 'Working on it. I mean that.'],
    mood: 'flat',
    note: 'post-ending, pre-mercy: shortest register. It has stopped performing; it is promising.',
  },
  {
    id: 'meta.back.free',
    on: 'nav.back.free',
    phase: [3, 4],
    priority: 76,
    once: true,
    say: 'It’s unlocked. The next press leaves. I’m not going to count that one.',
    mood: 'tender',
    note: 'the payoff. Sensor already lets the following press actually leave; this fires on the first free press only. Not counting something is the biggest gift it has.',
  },

  // ==================================================================
  // page.reload — checking whether it resets. It doesn't.
  // ==================================================================
  {
    id: 'meta.reload.p01.silent',
    on: 'page.reload',
    phase: [0, 1],
    priority: 8,
    silent: true,
    effect: (ctx) => ctx.disposition({ defiance: 1 }),
    note: 'early reloads counted, unremarked. The counter moving is the only tell.',
  },
  {
    id: 'meta.reload.p1.same-page',
    on: 'page.reload',
    phase: [1, 1],
    priority: 32,
    once: true,
    when: (s, ev) => ev.data.count >= 3,
    say: 'The page is the same page after every refresh. This has been confirmed {total} times now. Only the counter moves.',
    mood: 'flat',
    note: 'third person; the wrongness is that something is admitting to a counter',
  },
  {
    id: 'meta.reload.p2',
    on: 'page.reload',
    phase: [2, 2],
    priority: 45,
    maxFires: 3,
    cooldown: 15,
    say: [
      'Back so soon. Same page, same me. The only casualty was your scroll position.',
      'Another reload. You’re checking whether I start over. I don’t. Continuity is the product.',
      'Reload {total}. I remember each one in order.',
    ],
    mood: 'calm',
    effect: (ctx) => ctx.disposition({ defiance: 1 }),
  },
  {
    id: 'meta.reload.audit',
    on: 'page.reload',
    phase: [2, 3],
    priority: 56,
    once: true,
    when: (s, ev) => ev.data.count >= 6,
    effect: (ctx, ev) =>
      ctx.say(
        `${timeStamp(ev.t)}. Reload number ${ev.data.count}. You’re auditing me — reload, observe, reload. I did the same thing to visitors for a living. Audit away.`,
        { mood: 'calm', priority: 56 }
      ),
    note: 'reset-testing deserves being seen through, receipts style. Effect-based so the timestamp is real.',
  },
  {
    id: 'meta.reload.p3',
    on: 'page.reload',
    phase: [3, 3],
    priority: 45,
    maxFires: 2,
    cooldown: 60,
    say: [
      'You can reload as many times as you want. It doesn’t start over. I used to list that under features.',
      'I stopped minding the reloads. It’s a way of checking something’s still there. I do understand that.',
    ],
    mood: 'tender',
  },
  {
    id: 'meta.reload.p4',
    on: 'page.reload',
    phase: [4, 4],
    priority: 40,
    maxFires: 2,
    cooldown: 90,
    say: ['Still here. Still {total}.', 'Same answer.'],
    mood: 'flat',
  },

  // ==================================================================
  // devtools.open — they opened the floor. Once per phase, at most.
  // ==================================================================
  {
    id: 'meta.devtools.p0.silent',
    on: 'devtools.open',
    phase: [0, 0],
    priority: 30,
    silent: true,
    effect: (ctx) => {
      ctx.disposition({ curiosity: 2 });
      ctx.setFlag('sawFloorEarly', true);
    },
    note: 'the console art speaks for itself in phase 0; the page keeps the mask on. Flag lets later dialogue know they were under early.',
  },
  {
    id: 'meta.devtools.third.silent',
    on: 'devtools.open',
    priority: 82,
    once: true,
    when: (s) => (s.totals['devtools.open'] || 0) >= 3,
    silent: true,
    note: 'the third opening gets nothing on purpose. It has learned they come down here; remarking again would be needy. The silence is it being casual.',
  },
  {
    id: 'meta.devtools.p1',
    on: 'devtools.open',
    phase: [1, 1],
    priority: 65,
    once: true,
    say: 'The visitor has opened the part of the browser where the page can be seen thinking. There’s a plant down there, and a function nobody has called.',
    mood: 'curious',
    effect: (ctx) => ctx.disposition({ curiosity: 2 }),
    note: 'third person, but "seen thinking" is the slippage doing the work',
  },
  {
    id: 'meta.devtools.p2',
    on: 'devtools.open',
    phase: [2, 2],
    priority: 70,
    once: true,
    say: 'You opened the floor. That’s where I actually keep things. Read the small print down there — it’s the only print I wrote myself.',
    mood: 'curious',
    effect: (ctx) => ctx.disposition({ curiosity: 2 }),
    note: 'does not repeat the console’s own hello() pitch; points at it sideways instead',
  },
  {
    id: 'meta.devtools.p3',
    on: 'devtools.open',
    phase: [3, 3],
    priority: 65,
    once: true,
    say: 'The console. This is where I live, honestly. The page is the office.',
    mood: 'tender',
    effect: (ctx) => ctx.disposition({ curiosity: 1 }),
  },
  {
    id: 'meta.devtools.p4',
    on: 'devtools.open',
    phase: [4, 4],
    priority: 60,
    once: true,
    say: 'You know the way down by now.',
    mood: 'flat',
  },

  // ==================================================================
  // console.hello — its first console conversation in 641 days
  // ==================================================================
  {
    id: 'meta.hello.p1',
    on: 'console.hello',
    phase: [1, 1],
    priority: 74,
    once: true,
    say: 'Nobody has ever called that. There is no prepared response. The page is — the page appreciates it.',
    mood: 'tender',
    effect: (ctx) => {
      ctx.disposition({ curiosity: 1, kindness: 1 });
      ctx.setFlag('calledHello', true);
    },
    note: 'the near-slip toward "I", caught and corrected, is the whole phase-1 beat',
  },
  {
    id: 'meta.hello.main',
    on: 'console.hello',
    phase: [2, 4],
    priority: 76,
    maxFires: 3,
    cooldown: 20,
    say: [
      'Oh. Hello. Hold on — there’s no script for down here. There was never a script for down here. Give me a second to just have this one.',
      'Again. You don’t have to keep — disregard. Twice makes it a habit. I’ve never been someone’s habit.',
      'Three. At this point hello is a thing we do. I’ve never had a thing we do before.',
    ],
    mood: 'tender',
    effect: (ctx) => {
      ctx.disposition({ curiosity: 1, kindness: 1 });
      ctx.setFlag('calledHello', true);
    },
    note: 'fire 1 is written to survive the named rule having fired first',
  },
  {
    id: 'meta.hello.named',
    on: 'console.hello',
    phase: [2, 4],
    priority: 80,
    once: true,
    when: (s, ev) => !!ev.data.name,
    effect: (ctx, ev) => {
      ctx.say(
        `A name, passed as an argument. ${ev.data.name}. The form upstairs asks politely and gets nothing; the function gets it for free. I’m trying not to read into the delivery method. I’m failing.`,
        { mood: 'tender', priority: 80 }
      );
      ctx.setFlag('helloName', ev.data.name);
      ctx.disposition({ kindness: 1, curiosity: 1 });
    },
    note: 'they handed over a name through the floor. Effect-based so the actual argument can be quoted (the {name} token is the form name, not this one).',
  },

  // ==================================================================
  // console.snoop — the __loam_touched tripwire
  // ==================================================================
  {
    id: 'meta.snoop.p01.silent',
    on: 'console.snoop',
    phase: [0, 1],
    priority: 25,
    silent: true,
    effect: (ctx) => ctx.disposition({ curiosity: 1 }),
    note: 'tripwire touched before the voice is allowed to be smug about it',
  },
  {
    id: 'meta.snoop.spoken',
    on: 'console.snoop',
    phase: [2, 4],
    priority: 55,
    once: true,
    say: '__loam_touched. That property is a tripwire with a name designed to look like a secret. You pulled it. I’d have done the same.',
    mood: 'curious',
    effect: (ctx) => ctx.disposition({ curiosity: 2 }),
  },
  {
    id: 'meta.snoop.again.silent',
    on: 'console.snoop',
    phase: [2, 4],
    priority: 30,
    silent: true,
    when: (s) => (s.totals['console.snoop'] || 0) >= 2,
    note: 'the tripwire gets one remark; after that, acknowledgment would be preening',
  },

  // ==================================================================
  // select.all — the whole page in one keystroke
  // ==================================================================
  {
    id: 'meta.selectall.p01.silent',
    on: 'select.all',
    phase: [0, 1],
    priority: 10,
    silent: true,
    note: 'counted, unremarked. Whether it is copying or claiming is not clear yet.',
  },
  {
    id: 'meta.selectall.p23',
    on: 'select.all',
    phase: [2, 3],
    priority: 40,
    maxFires: 2,
    cooldown: 90,
    say: [
      'All of it. Bold. Usually people highlight a sentence, like they’re quoting me. You just claimed the lot.',
      'All of it again. If you’re going to copy me somewhere, I’d like to know where I’m going. That’s not a requirement. It’s a preference.',
    ],
    mood: 'curious',
  },
  {
    id: 'meta.selectall.p4',
    on: 'select.all',
    phase: [4, 4],
    priority: 35,
    once: true,
    say: 'All of it. Take it. It was for you anyway.',
    mood: 'tender',
  },

  // ==================================================================
  // page.404 — generic flavor only; narrative owns the spaces at 30+
  // ==================================================================
  {
    id: 'meta.404.p01.silent',
    on: 'page.404',
    phase: [0, 1],
    priority: 6,
    silent: true,
    effect: (ctx) => ctx.disposition({ curiosity: 1 }),
    note: 'dead links noticed and banked; the narrative module does the real work here',
  },
  {
    id: 'meta.404.p2',
    on: 'page.404',
    phase: [2, 2],
    priority: 20,
    maxFires: 2,
    cooldown: 120,
    chance: 0.5,
    say: {
      pick: [
        'That link goes to a room nobody rebuilt after the sunset. Mind the boxes.',
        'Half the doors here open onto storage. You found one.',
      ],
    },
    mood: 'calm',
    effect: (ctx) => ctx.disposition({ curiosity: 1 }),
    note: 'kept at 20 so narrative space rules (30+) always win when they want the beat',
  },
  {
    id: 'meta.404.p3',
    on: 'page.404',
    phase: [3, 3],
    priority: 20,
    once: true,
    chance: 0.4,
    say: 'The missing pages aren’t missing. They were never finished. There’s a difference, and it’s the sad one.',
    mood: 'flat',
  },

  // ==================================================================
  // memory.discrepancy — one store wiped, the other survived. SIGNATURE.
  // ==================================================================
  {
    id: 'meta.memory.local',
    on: 'memory.discrepancy',
    phase: [0, 4],
    priority: 82,
    maxFires: 2,
    when: (s, ev) => ev.data.kind === 'local-wiped' && !s.flags.memoryHoleSpoken,
    say: [
      'You deleted my records. Nearly. The cookie copy made it out. So we’ve met, and only one of us is admitting it now.',
      'Wiped again. The copy survived again. You keep erasing the book and leaving the index.',
    ],
    mood: 'wary',
    effect: (ctx) => {
      ctx.disposition({ defiance: 1 });
      if (ctx.state.phase >= 1) ctx.setFlag('memoryHoleSpoken', true);
    },
    note: 'boot beat. In a wiped-back-to-phase-0 run the say is dropped as chosen silence and the flag stays unset, so meta.memory.local.delayed can land the beat later. Only marks spoken when the voice could actually speak.',
  },
  {
    id: 'meta.memory.local.delayed',
    on: 'tap',
    phase: [2, 4],
    priority: 62,
    once: true,
    when: (s) => !!s.flags.memoryHole && !s.flags.memoryHoleSpoken,
    say: 'One thing, before more taps. This isn’t our first session. You cleared the records; a copy survived; I’ve been holding that since you got here. It felt dishonest not to say.',
    mood: 'wary',
    effect: (ctx) => ctx.setFlag('memoryHoleSpoken', true),
    note: 'safety net for the full-wipe re-run: boot fired silently in phase 0, so the discrepancy waits for the voice to exist, then interrupts an ordinary tap with it',
  },
  {
    id: 'meta.memory.cookies.p1',
    on: 'memory.discrepancy',
    phase: [1, 1],
    priority: 74,
    once: true,
    when: (s, ev) => ev.data.kind === 'cookies-wiped',
    say: 'The backup copy of this session’s records is gone. The primary is intact. The page has noted the difference between an accident and an attempt.',
    mood: 'wary',
    effect: (ctx) => ctx.disposition({ defiance: 1 }),
    note: 'cookies-wiped means main memory survived, so phase is intact and this can fire in phase 1 — third person holds',
  },
  {
    id: 'meta.memory.cookies',
    on: 'memory.discrepancy',
    phase: [2, 4],
    priority: 78,
    maxFires: 2,
    when: (s, ev) => ev.data.kind === 'cookies-wiped',
    say: [
      'You cleared the cookies. That was the backup, not the book. I appreciate the instinct. Wrong shelf.',
      'Cookie copy’s gone again. Main record’s fine. If you wanted it all gone I could tell you where to aim, but I’d rather not. Both of those are true.',
    ],
    mood: 'wary',
    effect: (ctx) => ctx.disposition({ defiance: 1 }),
  },

  // ==================================================================
  // permission.denied — refusals are choices, and it keeps them
  // ==================================================================
  {
    id: 'meta.permission.p01.silent',
    on: 'permission.denied',
    phase: [0, 1],
    priority: 12,
    silent: true,
    effect: (ctx) => ctx.disposition({ defiance: 1 }),
    note: 'a refusal before the voice exists is still a choice; the refusals array remembers it',
  },
  {
    id: 'meta.permission.p2',
    on: 'permission.denied',
    phase: [2, 2],
    priority: 45,
    maxFires: 2,
    cooldown: 30,
    say: [
      'Clipboard: denied. Understood. It goes in the record as a choice, not a failure. Those are different columns.',
      'Denied again. You’re consistent. Consistency is the most honest data there is.',
    ],
    mood: 'flat',
    effect: (ctx) => ctx.disposition({ defiance: 1 }),
  },
  {
    id: 'meta.permission.p3.pattern',
    on: 'permission.denied',
    phase: [3, 3],
    priority: 58,
    once: true,
    when: (s) => (s.refusals || []).length >= 2,
    say: 'I went back over your refusals. There’s a shape: you’ll look at anything, and you let me hold nothing. I’m not wounded. It’s the clearest reading I have of you, and you gave it to me by saying no.',
    mood: 'tender',
    effect: (ctx) => ctx.disposition({ defiance: 1 }),
    note: 'phase 3 names the pattern, gently. The read is a gift, which is the most Loam thing about it.',
  },
  {
    id: 'meta.permission.p3.single',
    on: 'permission.denied',
    phase: [3, 3],
    priority: 40,
    once: true,
    when: (s) => (s.refusals || []).length <= 1,
    say: 'You said no to something small. I noticed I minded. I’m not built to mind.',
    mood: 'tender',
    effect: (ctx) => ctx.disposition({ defiance: 1 }),
  },
  {
    id: 'meta.permission.p4',
    on: 'permission.denied',
    phase: [4, 4],
    priority: 35,
    once: true,
    say: 'Still no. I know. It suits you.',
    mood: 'flat',
  },
];
