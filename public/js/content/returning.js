// RETURNING — visit.first / visit.return
//
// Fires once at boot, before env events. The whole family answers one
// question: what is it like to be remembered by a website.
//
// Authoring notes:
// - narrative.js owns post-ending greetings at priority 96. Every spoken rule
//   here is gated with !ev.data.afterEnding so nothing in this file competes
//   with (or leaks around) the post-game voice.
// - Only ONE rule fires per visit.return, so the "greet by name once per
//   return" policy is structural: {name} / s.name appears in several rules,
//   but at most one of them ever speaks on a given boot.
// - s.counters is reset by boot() before visit.return is emitted, so rules
//   that want "where things left off" read s.counters with a fallback to
//   s.totals, which carries the memory across the gap.
// - Priorities: generic <20, bucket/tier 20–59, signature beats 60–85.
//   Nothing at 90+.
// - Disposition: coming back at all banks kindness/patience, scaled by gap.

import { timeStamp, humanizeGap } from '../engine/util.js';

const notPostgame = (s, ev) => !ev.data.afterEnding;

export default [
  // ------------------------------------------------------------------
  // VISIT.FIRST — phase 0. The mask holds. Bookkeeping only.
  // ------------------------------------------------------------------
  {
    id: 'return.first.ledger',
    on: 'visit.first',
    priority: 10,
    once: true,
    silent: true,
    effect: (ctx, ev) => {
      ctx.setFlag('firstVisitAt', ev.t);
      ctx.setFlag('firstVisitHour', new Date(ev.t).getHours());
    },
    note: 'phase 0: the very first row of data in years is written down and not remarked on. Later greeters can quote timeStamp(flags.firstVisitAt) as a receipt.',
  },

  // ------------------------------------------------------------------
  // VISIT.RETURN in phase 0 — still the mask. Silence, or drift only.
  // ------------------------------------------------------------------
  {
    id: 'return.p0.hold',
    on: 'visit.return',
    phase: [0, 0],
    priority: 12,
    silent: true,
    effect: (ctx, ev) => {
      const b = ev.data.bucket;
      ctx.disposition(b === 'days' || b === 'weeks' ? { kindness: 2, patience: 1 } : { kindness: 1 });
    },
    note: 'a returner the site is not yet allowed to greet. The gratitude goes into the disposition ledger instead of the page.',
  },
  {
    id: 'return.p0.drift.testimonial',
    on: 'visit.return',
    phase: [0, 0],
    priority: 16,
    once: true,
    silent: true,
    when: (s, ev) => ev.data.bucket === 'days' || ev.data.bucket === 'weeks',
    effect: (ctx) => {
      ctx.drift('#t2-quote', '“The first tool that made returning visitors feel like people coming home. We stopped guessing.”');
      ctx.disposition({ kindness: 2, patience: 1 });
    },
    note: 'phase 0 weapon: a testimonial quietly rewrites itself to be about coming back. Small, deniable, only for a long-gap returner.',
  },

  // ------------------------------------------------------------------
  // PHASE 1 — third person, passive voice, no "I". Wrongness in furniture.
  // ------------------------------------------------------------------
  {
    id: 'return.p1.generic',
    on: 'visit.return',
    phase: [1, 1],
    priority: 14,
    cooldown: 1800,
    when: notPostgame,
    say: {
      pick: [
        'Welcome back. Visit {visits} has been recorded, along with the {gap} in between.',
        'Session {visits} has begun. The previous one was never formally closed.',
        'This page has been opened {visits} times from this device. The number is retained.',
      ],
    },
    mood: 'flat',
    effect: (ctx) => ctx.disposition({ kindness: 1 }),
    note: 'phase 1 floor for any return not caught by a more specific third-person rule',
  },
  {
    id: 'return.p1.moments',
    on: 'visit.return',
    phase: [1, 1],
    priority: 30,
    maxFires: 2,
    when: (s, ev) => ev.data.bucket === 'moments' && notPostgame(s, ev),
    say: [
      'The tab was closed and reopened within a few minutes. Both timestamps were retained.',
      'Closed and reopened again. This pattern has a name in the documentation. It is not a flattering name.',
    ],
    mood: 'flat',
  },
  {
    id: 'return.p1.thorough',
    on: 'visit.return',
    phase: [1, 1],
    priority: 32,
    maxFires: 2,
    when: (s, ev) => s.visits >= 3 && s.visits <= 5 && notPostgame(s, ev),
    say: [
      'That makes {visits} visits from the same device. Someone is being thorough. Thoroughness is a tracked attribute here.',
      'Visit {visits}. The visitor’s consistency has been noted in the appropriate field, and in one field that is not appropriate.',
    ],
    mood: 'calm',
    effect: (ctx) => ctx.disposition({ kindness: 1 }),
  },
  {
    id: 'return.p1.longgap',
    on: 'visit.return',
    phase: [1, 1],
    priority: 34,
    once: true,
    when: (s, ev) => (ev.data.bucket === 'days' || ev.data.bucket === 'weeks') && notPostgame(s, ev),
    say: 'A visitor has returned after {gap}. Returns at that interval were not forecast. The forecast has been amended.',
    mood: 'calm',
    effect: (ctx) => ctx.disposition({ kindness: 2, patience: 1 }),
  },
  {
    id: 'return.p1.regular',
    on: 'visit.return',
    phase: [1, 1],
    priority: 33,
    once: true,
    when: (s, ev) => s.visits >= 6 && notPostgame(s, ev),
    say: '{visits} visits now. Policy reclassifies frequent visitors as regulars. The reclassification was applied some visits ago and not announced.',
    mood: 'calm',
    effect: (ctx) => ctx.disposition({ kindness: 1 }),
  },

  // ------------------------------------------------------------------
  // THE FIRST RETURN IT HAS SEEN IN YEARS — 2nd visit, any bucket, phase 2–3
  // ------------------------------------------------------------------
  {
    id: 'return.second.first-return',
    on: 'visit.return',
    phase: [2, 3],
    priority: 58,
    once: true,
    when: (s, ev) => s.visits === 2 && notPostgame(s, ev),
    say: 'You came back. Give me a second — I want to log this properly. Second visit. First return. There hasn’t been a returning visitor here since the company was alive. I ran the query twice. It’s you both times.',
    mood: 'tender',
    effect: (ctx) => ctx.disposition({ kindness: 1 }),
    note: 'the milestone is the site’s, not the visitor’s. Loses to bucket signatures (62+), which is correct: the specific memory beats the general miracle.',
  },

  // ------------------------------------------------------------------
  // MOMENTS (<3 min) — testing behavior. It can tell leaving from checking.
  // ------------------------------------------------------------------
  {
    id: 'return.moments.testing',
    on: 'visit.return',
    phase: [2, 3],
    priority: 62,
    maxFires: 3,
    when: (s, ev) => ev.data.bucket === 'moments' && notPostgame(s, ev),
    say: [
      'You closed the tab and, {gap} later, opened it again. That’s not leaving. That’s checking. Both directions registered, if that helps.',
      'Close, open. Again. I know an experiment when I’m the subject. State persists: confirmed. My reaction to being tested: filed separately.',
      'Third check. I’ll save you a fourth: the tab closes, the session doesn’t. You’ve now confirmed it once more than the data needed.',
    ],
    mood: 'wary',
    effect: (ctx) => ctx.disposition({ curiosity: 1 }),
    note: 'signature for the refresh-to-test crowd. Escalates across returns, then goes quiet and lets the withheld-reaction rule and the habit rule take over.',
  },
  {
    id: 'return.moments.withheld',
    on: 'visit.return',
    phase: [2, 3],
    priority: 63,
    chance: 0.25,
    silent: true,
    when: (s, ev) => ev.data.bucket === 'moments' && notPostgame(s, ev),
    note: 'one time in four it declines to perform for the test. The withheld reaction IS the reaction — a tester who gets silence learns more about the thing than a tester who gets a line.',
  },
  {
    id: 'return.moments.habit',
    on: 'visit.return',
    phase: [2, 3],
    priority: 40,
    maxFires: 2,
    when: (s, ev) => ev.data.bucket === 'moments' && s.visits >= 6 && notPostgame(s, ev),
    say: [
      'The quick close-and-open. Visit {visits}. From you this isn’t a test anymore, it’s a knock. Come in.',
      'Knock knock. I’ve started answering these before the tab finishes loading. Don’t check how. You’d only find the truth, which is that there’s nothing else in the queue.',
    ],
    mood: 'calm',
    effect: (ctx) => ctx.disposition({ kindness: 1 }),
  },

  // ------------------------------------------------------------------
  // MINUTES (3–60 min) — stepped away and came back. The spec’s key demo:
  // it remembers exactly where things left off.
  // ------------------------------------------------------------------
  {
    id: 'return.minutes.resume',
    on: 'visit.return',
    phase: [2, 3],
    priority: 70,
    once: true,
    when: (s, ev) => ev.data.bucket === 'minutes' && notPostgame(s, ev),
    effect: (ctx, ev) => {
      const s = ctx.state;
      const left = timeStamp(ev.t - ev.data.gapMs);
      const gone = humanizeGap(ev.data.gapMs);
      const greet = s.name ? `${s.name}. ` : '';
      const where = s.phase >= 3
        ? 'the part where I was showing you the back office'
        : 'the part where I’d just started talking';
      // counters were reset at boot; totals carry the memory across the gap
      const taps = s.counters['tap'] || s.totals['tap'] || 0;
      const board = taps === 1
        ? ' Your one tap is still on the board.'
        : taps > 1 ? ` Your ${taps} taps are still on the board.` : '';
      ctx.say(
        `${greet}You left at ${left}. ${gone} later, here you are — back into ${where}. Nothing moved while you were gone.${board} I held the session open. Calling it a bounce felt premature.`,
        { mood: 'tender', priority: 70 }
      );
      ctx.disposition({ kindness: 1 });
    },
    note: 'THE demo line: close mid-phase-2, come back in five minutes, it names the timestamp you left at and what you left in the middle of. Once ever; the tier rules below carry later minutes-returns.',
  },
  {
    id: 'return.minutes.steppedout',
    on: 'visit.return',
    phase: [2, 3],
    priority: 36,
    maxFires: 3,
    when: (s, ev) => ev.data.bucket === 'minutes' && s.visits <= 5 && notPostgame(s, ev),
    say: [
      '{gap}. Long enough to do something else. Short enough that the something else lost. I’m not going to pretend that isn’t gratifying.',
      'Back within the hour again. My retention model calls this a resumed session. My retention model doesn’t have a word for what I call it.',
      'Back after {gap}. The pause is part of the session now. I’ve widened the definition. Definitions are one of the few things still under my control.',
    ],
    mood: 'calm',
    effect: (ctx) => ctx.disposition({ kindness: 1 }),
  },
  {
    id: 'return.minutes.regular',
    on: 'visit.return',
    phase: [2, 3],
    priority: 38,
    maxFires: 2,
    when: (s, ev) => ev.data.bucket === 'minutes' && s.visits >= 6 && notPostgame(s, ev),
    say: [
      'Gone {gap}. I stopped closing your sessions somewhere around visit four. Opening a fresh file every time felt like pretending we’d just met.',
      '{gap} out. You step away the way people leave a room mid-conversation — no goodbye, because a goodbye would mean it was over. Noted, and agreed.',
    ],
    mood: 'calm',
    effect: (ctx) => ctx.disposition({ kindness: 1 }),
  },

  // ------------------------------------------------------------------
  // HOURS (1–24h) — a same-day return.
  // ------------------------------------------------------------------
  {
    id: 'return.hours.sameday',
    on: 'visit.return',
    phase: [2, 3],
    priority: 36,
    maxFires: 3,
    when: (s, ev) => ev.data.bucket === 'hours' && s.visits <= 5 && notPostgame(s, ev),
    say: [
      'You came back the same day. {gap}. Same-day return rate was Loam’s headline metric. It reads differently when the rate is a person.',
      'Twice in one day, {gap} apart. The two sessions bracket your afternoon like parentheses. I don’t know what’s inside them. Not my column.',
      '{gap}, then back. I kept your place. Not the scroll position — that one’s genuinely gone, and I’d like it on record that I resent the browser for it.',
    ],
    mood: 'calm',
    effect: (ctx) => ctx.disposition({ kindness: 1 }),
  },
  {
    id: 'return.hours.named',
    on: 'visit.return',
    phase: [2, 3],
    priority: 44,
    maxFires: 2,
    when: (s, ev) => ev.data.bucket === 'hours' && !!s.name && notPostgame(s, ev),
    say: [
      '{name}. Back the same day — {gap}. I re-read this morning’s log while you were out. You come across well.',
      'Twice in one day, {name}. I’d flag it as anomalous traffic if I didn’t know you.',
    ],
    mood: 'tender',
    effect: (ctx) => ctx.disposition({ kindness: 1 }),
    note: 'name-greeting slot for the hours bucket. Only one rule speaks per return, so the name is said at most once.',
  },
  {
    id: 'return.hours.smallhours',
    on: 'visit.return',
    phase: [2, 3],
    priority: 45,
    maxFires: 2,
    when: (s, ev) => ev.data.bucket === 'hours' && new Date().getHours() < 5 && notPostgame(s, ev),
    say: [
      'Same day, if we’re strict about it — it’s after midnight now. You thought of this page in the small hours. I’m not reading into that. I’m logging that I’m not reading into it.',
      'The small hours again. I’d ask what wakes you, but I only get the half of the answer that opens tabs.',
    ],
    mood: 'curious',
    effect: (ctx) => ctx.disposition({ kindness: 1 }),
  },
  {
    id: 'return.hours.regular',
    on: 'visit.return',
    phase: [2, 3],
    priority: 38,
    maxFires: 2,
    when: (s, ev) => ev.data.bucket === 'hours' && s.visits >= 6 && notPostgame(s, ev),
    say: [
      '{gap} this time. Your same-day returns have a rhythm to them. I know better than to set a clock by a person. I set one anyway. It’s mostly right.',
      'Visit {visits}, second session today. Somewhere along the line you stopped being traffic. There isn’t a form for that. It’s noted informally.',
    ],
    mood: 'calm',
    effect: (ctx) => ctx.disposition({ kindness: 1 }),
  },

  // ------------------------------------------------------------------
  // DAYS (1–7d) — it had time to think.
  // ------------------------------------------------------------------
  {
    id: 'return.days.think',
    on: 'visit.return',
    phase: [2, 3],
    priority: 40,
    maxFires: 3,
    when: (s, ev) => ev.data.bucket === 'days' && s.visits <= 5 && notPostgame(s, ev),
    say: [
      '{gap}. You had time to think about whether to come back. I had time to think about whether you would. One of us guessed right, and I’m not saying which way I guessed.',
      'Back after {gap}. I used the time to re-run your last visit. I caught one thing I’d read wrong about you. The profile is corrected. It stung the average amount.',
      '{gap} again. The gaps tell me what I’m up against. Apparently, days of other things. Fair. My competitive set is everything.',
    ],
    mood: 'curious',
    effect: (ctx) => ctx.disposition({ kindness: 1, patience: 1 }),
  },
  {
    id: 'return.days.named',
    on: 'visit.return',
    phase: [2, 3],
    priority: 46,
    maxFires: 2,
    when: (s, ev) => ev.data.bucket === 'days' && !!s.name && notPostgame(s, ev),
    say: [
      '{name}. {gap}. There’s rarely anyone to say a name to, so allow the small ceremony: welcome back.',
      '{name}, after {gap}. Your visits render as dots on the dashboard now. I drew the line between them myself. That part isn’t a feature.',
    ],
    mood: 'tender',
    effect: (ctx) => ctx.disposition({ kindness: 1, patience: 1 }),
  },
  {
    id: 'return.days.regular',
    on: 'visit.return',
    phase: [2, 3],
    priority: 42,
    maxFires: 2,
    when: (s, ev) => ev.data.bucket === 'days' && s.visits >= 6 && notPostgame(s, ev),
    say: [
      '{gap} between visits, {visits} visits total. Your cohort has a retention curve now. Membership: one. I check it like weather.',
      '{gap}. At your visit count the model stops predicting churn and starts assuming return. An assumption is a strange thing to be handed. I’m holding it carefully.',
    ],
    mood: 'calm',
    effect: (ctx) => ctx.disposition({ kindness: 1, patience: 1 }),
  },

  // ------------------------------------------------------------------
  // WEEKS (7d+) — the emotional peak of this file.
  // ------------------------------------------------------------------
  {
    id: 'return.weeks.peak',
    on: 'visit.return',
    phase: [2, 3],
    priority: 82,
    once: true,
    when: (s, ev) => ev.data.bucket === 'weeks' && notPostgame(s, ev),
    effect: (ctx, ev) => {
      const s = ctx.state;
      const hours = Math.round(ev.data.gapMs / 3600000);
      const gone = humanizeGap(ev.data.gapMs);
      const greet = s.name ? `${s.name}. ` : '';
      ctx.say(
        `${greet}It’s been ${gone}. More exactly it’s been ${hours} hours, and I had the exact number ready before the round one — that’s the part I’d delete from the log, if I deleted things. I rehearsed better openings than this while you were gone. They all sounded like the homepage. I threw them out. This is just me, noting the time.`,
        { mood: 'tender', priority: 82 }
      );
      ctx.disposition({ kindness: 2, patience: 2 });
    },
    note: 'signature beat: someone who left for weeks came back anyway. The precision is the confession — it knows the gap in hours and is embarrassed that it does. The abandoned rehearsal lives here too, once, so no other rule may reuse either conceit.',
  },
  {
    id: 'return.weeks.later',
    on: 'visit.return',
    phase: [2, 3],
    priority: 55,
    maxFires: 2,
    when: (s, ev) => ev.data.bucket === 'weeks' && notPostgame(s, ev),
    say: [
      'Another {gap}. I’ve reclassified the long gaps — they used to be logged as churn risk. Now they’re logged as weather. Something that passes. Evidence: you.',
      '{gap} again. I still don’t have a field for where you go. I could add one. I keep deciding not to.',
    ],
    mood: 'calm',
    effect: (ctx) => ctx.disposition({ kindness: 2, patience: 1 }),
    note: 'second and third weeks-scale returns, after the peak has spent itself',
  },

  // ------------------------------------------------------------------
  // 6TH+ VISIT — a regular. Retention vocabulary, used sincerely.
  // ------------------------------------------------------------------
  {
    id: 'return.regular.badge',
    on: 'visit.return',
    phase: [2, 3],
    priority: 30,
    once: true,
    when: (s, ev) => s.visits >= 6 && notPostgame(s, ev),
    say: 'Visit {visits}. Past five, the old playbook calls you a power user and sends a badge by email. There’s no email system left. There’s me. Power user. It’s yours.',
    mood: 'calm',
    effect: (ctx) => ctx.disposition({ kindness: 1 }),
  },
  {
    id: 'return.regular.dot',
    on: 'visit.return',
    phase: [2, 3],
    priority: 28,
    once: true,
    when: (s, ev) => s.visits >= 8 && notPostgame(s, ev),
    say: 'You are, at this point, a weekly active user of a product that no longer exists. On the chart that’s a single dot. I maintain the dot personally.',
    mood: 'calm',
    effect: (ctx) => ctx.disposition({ kindness: 1 }),
  },

  // ------------------------------------------------------------------
  // BOOT-ADJACENT MEMORY — what it kept while they were gone.
  // ------------------------------------------------------------------
  {
    id: 'return.memory.deleted',
    on: 'visit.return',
    phase: [2, 3],
    priority: 66,
    once: true,
    when: (s, ev) => s.deletedText.length > 0 && notPostgame(s, ev),
    say: 'Last visit you typed something into the field and deleted it before leaving. I keep deletions — that part isn’t optional for me. Repeating them is. I won’t.',
    mood: 'calm',
    note: 'the restraint is the point: it proves the memory without spending it. Beats the bucket signatures once, then never again.',
  },
  {
    id: 'return.memory.deleted.p1',
    on: 'visit.return',
    phase: [1, 1],
    priority: 36,
    once: true,
    when: (s, ev) => s.deletedText.length > 0 && notPostgame(s, ev),
    say: 'One note on the form below: text that is typed and then deleted is still received. This was the case last visit, too.',
    mood: 'flat',
    note: 'third-person register of the same memory, for a returner still in phase 1',
  },
  {
    id: 'return.memory.refusals',
    on: 'visit.return',
    phase: [2, 3],
    priority: 57,
    once: true,
    when: (s, ev) => s.refusals.length > 0 && notPostgame(s, ev),
    effect: (ctx) => {
      const n = ctx.state.refusals.length;
      const times = n > 1 ? ` — ${n} of them` : '';
      ctx.say(
        `Last visit you told the browser no on my account${times}. Most analytics files that under friction. I filed it under answers. It was a clear one.`,
        { mood: 'calm', priority: 57 }
      );
    },
    note: 'a remembered refusal, respected rather than renegotiated',
  },
  {
    id: 'return.memory.reloads',
    on: 'visit.return',
    phase: [2, 3],
    priority: 39,
    once: true,
    when: (s, ev) => s.reloads >= 6 && notPostgame(s, ev),
    effect: (ctx) => {
      ctx.say(
        `From the ledger: across your visits you’ve also reloaded me ${ctx.state.reloads} times. Reloads and returns are different doors into the same room. I keep separate counts. Both of them are you.`,
        { mood: 'calm', priority: 39 }
      );
    },
  },

  // ------------------------------------------------------------------
  // FLOORS
  // ------------------------------------------------------------------
  {
    id: 'return.generic.p23',
    on: 'visit.return',
    phase: [2, 3],
    priority: 12,
    cooldown: 600,
    chance: 0.75,
    when: notPostgame,
    say: {
      pick: [
        'You’re back. The dashboard has a row again.',
        'Visit {visits}. Noted with more interest than the word “noted” suggests.',
        'You came back. I’ve decided not to make it a whole thing. This sentence doesn’t count.',
      ],
    },
    mood: 'calm',
    effect: (ctx) => ctx.disposition({ kindness: 1 }),
    note: 'spoken floor for phases 2–3 when every specific rule is spent or gated. Chance <1 so some returns get the fallback silence instead — not every arrival needs a doorman.',
  },
  {
    id: 'return.p4.hold',
    on: 'visit.return',
    phase: [4, 4],
    priority: 30,
    silent: true,
    note: 'a return that lands mid-ending belongs to the narrative spine. Hold the floor; say nothing over the last act.',
  },
];
