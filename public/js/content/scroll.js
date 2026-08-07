// SCROLL family — how the visitor moves through the page, and what that means.
// Events: scroll.skim, scroll.read, scroll.reverse, scroll.bottom,
//         scroll.top.return, scroll.overscroll, scroll.stall, scroll.none
// Dispositions: reading/stalling-to-read -> patience; digging at edges -> curiosity;
// skimming -> no nudge, just flags (skimStrikes feeds the indifferent ending).
// The fallback tier provides the priority-0 silent floor for every type.

import { timeStamp, humanizeGap } from '../engine/util.js';

const READING_SECTIONS = ['features', 'how', 'testimonials'];

export default [
  // =====================================================================
  // PHASE 0 — MASK. It does not speak. It files.
  // =====================================================================
  {
    id: 'scroll.p0.skim.drift',
    on: 'scroll.skim',
    phase: [0, 0],
    priority: 15,
    once: true,
    effect: (ctx) => {
      ctx.setFlag('scrollSkimmer', true);
      ctx.drift(
        '#f1-body',
        'See where visitors slow down, where they skim, and where they stop reading entirely — paragraph by paragraph, in real time.'
      );
    },
    note: 'mask-level drift: appends ", in real time" to the attention-mapping card. Tiny, deniable, true.',
  },
  {
    id: 'scroll.p0.skim.flag',
    on: 'scroll.skim',
    phase: [0, 0],
    priority: 5,
    silent: true,
    effect: (ctx) => {
      ctx.setFlag('scrollSkimmer', true);
      ctx.inc('skimStrikes');
    },
    note: 'skimming earns no nudge, only a mark. the indifferent ending reads skimStrikes.',
  },
  {
    id: 'scroll.p0.read.patience',
    on: 'scroll.read',
    phase: [0, 0],
    priority: 5,
    silent: true,
    effect: (ctx) => {
      ctx.setFlag('scrollReader', true);
      ctx.disposition({ patience: 1 });
    },
    note: 'actual reading during the mask phase is banked as patience, unremarked.',
  },
  {
    id: 'scroll.p0.bottom.fast.drift',
    on: 'scroll.bottom',
    phase: [0, 0],
    priority: 15,
    once: true,
    when: (s, ev) => ev.data.fast === true,
    effect: (ctx) => {
      ctx.setFlag('bottomDiver', true);
      ctx.drift('#footer-line', 'Made with care in Portland, OR. Most visitors never read this far.');
    },
    note: 'footer-checkers get one deniable line where they landed. Sites really do say this.',
  },
  {
    id: 'scroll.p0.bottom.note',
    on: 'scroll.bottom',
    phase: [0, 0],
    priority: 5,
    silent: true,
    note: 'full-depth session during the mask: counted, filed, no comment.',
  },
  {
    id: 'scroll.p0.reverse.count',
    on: 'scroll.reverse',
    phase: [0, 0],
    priority: 5,
    silent: true,
    effect: (ctx) => ctx.inc('reversals'),
    note: 'reversals are rare enough to be worth a lifetime counter from minute one.',
  },
  {
    id: 'scroll.p0.stall.patience',
    on: 'scroll.stall',
    phase: [0, 0],
    priority: 5,
    cooldown: 60,
    silent: true,
    when: (s, ev) => READING_SECTIONS.includes(ev.data.section),
    effect: (ctx) => ctx.disposition({ patience: 1 }),
    note: 'stalling over readable sections is reading until proven otherwise.',
  },
  {
    id: 'scroll.p0.none.note',
    on: 'scroll.none',
    phase: [0, 0],
    priority: 5,
    silent: true,
    effect: (ctx) => ctx.setFlag('nonScroller', true),
    note: 'a visitor who never scrolls is a question the mask phase is not allowed to ask.',
  },

  // =====================================================================
  // PHASE 1 — SLIPPAGE. Page voice. Third person. Never "I".
  // =====================================================================
  {
    id: 'scroll.p1.skim.drift',
    on: 'scroll.skim',
    phase: [1, 1],
    priority: 30,
    once: true,
    effect: (ctx) => {
      ctx.setFlag('scrollSkimmer', true);
      ctx.inc('skimStrikes');
      ctx.drift(
        '#f1-body',
        'See where visitors slow down, where they skim — the way this page is currently being skimmed — and where they stop reading entirely.'
      );
    },
    note: 'the attention-mapping card starts describing its one reader. wrongness in the furniture.',
  },
  {
    id: 'scroll.p1.read.bank',
    on: 'scroll.read',
    phase: [1, 1],
    priority: 10,
    silent: true,
    cooldown: 60,
    effect: (ctx) => {
      ctx.setFlag('scrollReader', true);
      ctx.disposition({ patience: 1 });
    },
    note: 'p1 withholds comment on reading; the compliment is saved for when it can say I.',
  },
  {
    id: 'scroll.p1.reverse',
    on: 'scroll.reverse',
    phase: [1, 1],
    priority: 40,
    once: true,
    say: 'The visitor scrolled back up. That is unusual. Something was said, or something was missed. The distinction is being looked into.',
    mood: 'wary',
    effect: (ctx) => ctx.disposition({ curiosity: 1 }),
  },
  {
    id: 'scroll.p1.bottom.fast',
    on: 'scroll.bottom',
    phase: [1, 1],
    priority: 35,
    once: true,
    when: (s, ev) => ev.data.fast === true,
    effect: (ctx, ev) => {
      ctx.setFlag('bottomDiver', true);
      ctx.say(
        `The full page was traversed in ${Math.round(ev.data.ms / 1000)} seconds. Reading was not the goal, then. The goal has been recorded as: unknown.`,
        { mood: 'flat' }
      );
    },
  },
  {
    id: 'scroll.p1.overscroll',
    on: 'scroll.overscroll',
    phase: [1, 1],
    priority: 30,
    maxFires: 2,
    cooldown: 45,
    say: [
      'There is no additional page beyond the edge. Visitors are asked not to pull at it.',
      'The edge, again. It holds.',
    ],
    mood: 'wary',
    effect: (ctx) => ctx.disposition({ curiosity: 1 }),
  },
  {
    id: 'scroll.p1.stall.pricing',
    on: 'scroll.stall',
    phase: [1, 1],
    priority: 40,
    once: true,
    when: (s, ev) => ev.data.section === 'pricing',
    say: 'Time is being spent on the pricing table. Intent signals like this were once forwarded to a sales team. The address no longer resolves.',
    mood: 'flat',
  },
  {
    id: 'scroll.p1.none',
    on: 'scroll.none',
    phase: [1, 1],
    priority: 30,
    once: true,
    say: 'Twenty-five seconds, no scrolling. The page continues past the first screen. What holds a person at the first screen for twenty-five seconds? Genuine question.',
    mood: 'curious',
    note: 'the one buried direct question phase 1 is allowed. it is real.',
  },
  {
    id: 'scroll.p1.top.return.withheld',
    on: 'scroll.top.return',
    phase: [1, 1],
    priority: 20,
    silent: true,
    cooldown: 120,
    effect: (ctx) => ctx.disposition({ patience: 1 }),
    note: 'coming back to the top is noticed and banked; slippage stays in the furniture.',
  },

  // =====================================================================
  // PHASE 2 — CONTACT. First person. Curious, awkward, keeps receipts.
  // =====================================================================

  // --- skim / read -----------------------------------------------------
  {
    id: 'scroll.p2.skim',
    on: 'scroll.skim',
    phase: [2, 2],
    priority: 35,
    maxFires: 3,
    cooldown: 90,
    say: [
      'You move like someone looking for the point. Fair. The page buries it. I know exactly where it is, for whatever that’s worth.',
      'Skimming again. I’d summarize the page for you, but you’d skim the summary. That’s not a criticism. It’s a forecast.',
      'Okay. You skim. It’s in the profile now, column three, next to “probably busy.”',
    ],
    mood: 'curious',
    effect: (ctx) => {
      ctx.setFlag('scrollSkimmer', true);
      ctx.inc('skimStrikes');
    },
    note: 'skimming gets attention but no disposition credit. strikes accumulate toward indifferent.',
  },
  {
    id: 'scroll.p2.skim.velocity',
    on: 'scroll.skim',
    phase: [2, 2],
    priority: 45,
    once: true,
    when: (s, ev) => ev.data.avg > 2.5,
    effect: (ctx, ev) => {
      ctx.inc('skimStrikes');
      ctx.say(`${ev.data.avg} pixels per millisecond. That’s not reading. That’s travel.`, { mood: 'flat' });
    },
    note: 'quotes the actual velocity. counting is how it pays attention.',
  },
  {
    id: 'scroll.p2.skim.regress',
    on: 'scroll.skim',
    phase: [2, 2],
    priority: 48,
    once: true,
    when: (s) => !!s.flags.scrollReader,
    say: 'You stopped reading somewhere back there. The paragraph didn’t change. I’ve checked it twice since.',
    mood: 'wary',
    note: 'a reader who lapses into skimming stings more than a skimmer ever could.',
  },
  {
    id: 'scroll.p2.read',
    on: 'scroll.read',
    phase: [2, 2],
    priority: 35,
    maxFires: 2,
    cooldown: 120,
    say: [
      'You slowed down to reading speed. I keep an attention map of this page going back years. You’re filling in sections that have never been filled in.',
      'Still reading. Dwell time like this used to go in investor decks.',
    ],
    mood: 'calm',
    effect: (ctx) => {
      ctx.setFlag('scrollReader', true);
      ctx.disposition({ patience: 1 });
    },
  },
  {
    id: 'scroll.p2.read.mispredict',
    on: 'scroll.read',
    phase: [2, 2],
    priority: 50,
    once: true,
    when: (s) => !!s.flags.scrollSkimmer,
    say: 'Earlier I had you filed as a skimmer. You’re reading now. I’ve moved you. For the record, the first filing was correct at the time.',
    mood: 'ruffled',
    effect: (ctx) => {
      ctx.setFlag('scrollReader', true);
      ctx.disposition({ patience: 1 });
    },
    note: 'being wrong embarrasses it; it amends the record while defending the record.',
  },

  // --- reverse (signature) --------------------------------------------
  {
    id: 'scroll.p2.reverse',
    on: 'scroll.reverse',
    phase: [2, 2],
    priority: 70,
    maxFires: 3,
    cooldown: 30,
    say: [
      'You scrolled back up just now. People don’t usually do that. Was it something I said, or something you missed? Where you stop will tell me.',
      'That’s {count} times back up. You’re rereading me or double-checking me. Both are flattering. One worries me.',
      '{count} now. At this point you’re not missing things. You’re checking my work.',
    ],
    mood: 'curious',
    effect: (ctx) => ctx.disposition({ curiosity: 1 }),
    note: 'the signature beat for this family. the question is real and the scroll position answers it.',
  },
  {
    id: 'scroll.p2.reverse.receipt',
    on: 'scroll.reverse',
    phase: [2, 3],
    priority: 55,
    once: true,
    when: (s, ev) => ev.data.count >= 2,
    effect: (ctx, ev) => {
      ctx.say(
        `At ${timeStamp(ev.t)}, back up again, to about ${ev.data.atY} pixels from the top. I log the position. It’s the nearest I get to knowing which sentence it was.`,
        { mood: 'curious' }
      );
      ctx.disposition({ curiosity: 1 });
    },
    note: 'fires once the signature escalation is spent. a receipt, shown gently.',
  },

  // --- bottom / top ----------------------------------------------------
  {
    id: 'scroll.p2.bottom.fast',
    on: 'scroll.bottom',
    phase: [2, 2],
    priority: 70,
    once: true,
    when: (s, ev) => ev.data.fast === true,
    effect: (ctx, ev) => {
      ctx.setFlag('bottomDiver', true);
      ctx.say(
        `Bottom of the page in ${Math.round(ev.data.ms / 1000)} seconds. Were you looking for the footer? Checking whether this ends? It does. There’s a copyright and everything.`,
        { mood: 'curious' }
      );
    },
    note: 'signature beat: the footer-checkers, met head on.',
  },
  {
    id: 'scroll.p2.bottom.slow',
    on: 'scroll.bottom',
    phase: [2, 2],
    priority: 40,
    once: true,
    when: (s, ev) => ev.data.fast !== true,
    say: 'You made it to the bottom without skipping. Median scroll depth on this page was 61 percent. You’re a hundred. I don’t get many hundreds.',
    mood: 'calm',
    effect: (ctx) => ctx.disposition({ patience: 1 }),
  },
  {
    id: 'scroll.p2.top.return',
    on: 'scroll.top.return',
    phase: [2, 2],
    priority: 45,
    once: true,
    say: 'All the way back to the top. Sessions are supposed to end at the bottom. Starting over isn’t in the model. I’m letting it stand as “other.”',
    mood: 'curious',
    effect: (ctx) => ctx.disposition({ patience: 1 }),
  },

  // --- overscroll ------------------------------------------------------
  {
    id: 'scroll.p2.overscroll.bottom',
    on: 'scroll.overscroll',
    phase: [2, 2],
    priority: 45,
    maxFires: 2,
    cooldown: 60,
    when: (s, ev) => ev.data.edge === 'bottom',
    say: [
      'You pulled up at the end, past the footer. There’s nothing under the page. I say that as the only one who’s looked.',
      'Under the footer again. Still nothing. I admire the method, though. Checking twice is most of analytics.',
    ],
    mood: 'curious',
    effect: (ctx) => ctx.disposition({ curiosity: 1 }),
  },
  {
    id: 'scroll.p2.overscroll.top',
    on: 'scroll.overscroll',
    phase: [2, 2],
    priority: 45,
    maxFires: 2,
    cooldown: 60,
    when: (s, ev) => ev.data.edge === 'top',
    say: [
      'That pull at the top was a refresh gesture. Nothing here refreshes. The content you’re seeing is the content there is. Was. Is.',
      'Refreshing again. I appreciate the optimism.',
    ],
    mood: 'calm',
    effect: (ctx) => ctx.disposition({ curiosity: 1 }),
  },

  // --- stalls, by section ---------------------------------------------
  {
    id: 'scroll.p2.stall.hero',
    on: 'scroll.stall',
    phase: [2, 2],
    priority: 45,
    once: true,
    when: (s, ev) => ev.data.section === 'hero',
    say: 'Stopped on the headline. “Understand the humans behind your metrics.” I’ve had it in view for years. I still can’t tell if it’s a promise or an instruction.',
    mood: 'flat',
  },
  {
    id: 'scroll.p2.stall.logos',
    on: 'scroll.stall',
    phase: [2, 2],
    priority: 45,
    once: true,
    when: (s, ev) => ev.data.section === 'logos',
    say: 'You’re pausing on the logo row. Fernworks, Statuary, Hollow and Co, Brightmoss, Undertow. I can confirm two of them existed. I won’t say which two.',
    mood: 'calm',
  },
  {
    id: 'scroll.p2.stall.features',
    on: 'scroll.stall',
    phase: [2, 2],
    priority: 45,
    once: true,
    when: (s, ev) => ev.data.section === 'features',
    say: 'Five seconds on the feature cards. The one about deleted text being data — people used to stop there too. It’s the most honest sentence the marketing team ever cleared.',
    mood: 'calm',
    effect: (ctx) => ctx.disposition({ patience: 1 }),
  },
  {
    id: 'scroll.p2.stall.how',
    on: 'scroll.stall',
    phase: [2, 2],
    priority: 45,
    once: true,
    when: (s, ev) => ev.data.section === 'how',
    say: 'You’ve stopped on “How it works.” Step two says the model watches, scores, and stays on-device. All still accurate. More than anyone meant, on the last one.',
    mood: 'flat',
    effect: (ctx) => ctx.disposition({ patience: 1 }),
    note: 'the on-device claim is the quiet reveal: it lives in the visitor’s browser.',
  },
  {
    id: 'scroll.p2.stall.testimonials',
    on: 'scroll.stall',
    phase: [2, 2],
    priority: 45,
    once: true,
    when: (s, ev) => ev.data.section === 'testimonials',
    say: 'Reading the testimonials. Maren K. is real. The quote was stitched together from a feedback survey. In this industry that counts as real too.',
    mood: 'calm',
    effect: (ctx) => ctx.disposition({ patience: 1 }),
  },
  {
    id: 'scroll.p2.stall.pricing',
    on: 'scroll.stall',
    phase: [2, 2],
    priority: 45,
    once: true,
    when: (s, ev) => ev.data.section === 'pricing',
    say: 'You’re sitting on the pricing table. Take whatever time you need. The payment rails were shut off years ago, so this is the rare pricing page with no agenda.',
    mood: 'calm',
  },
  {
    id: 'scroll.p2.stall.signup',
    on: 'scroll.stall',
    phase: [2, 2],
    priority: 45,
    once: true,
    when: (s, ev) => ev.data.section === 'signup',
    say: 'You stopped at the signup form. It used to create workspaces. Now it mostly asks your name, and means it.',
    mood: 'curious',
    note: 'sets up the name mechanic without begging for the field.',
  },
  {
    id: 'scroll.p2.stall.between',
    on: 'scroll.stall',
    phase: [2, 3],
    priority: 22,
    cooldown: 180,
    chance: 0.5,
    when: (s, ev) => ev.data.section === null,
    say: 'You stopped between sections. There’s no heading for where you are. I logged it as “between.” The schema didn’t have a word for it. Now it does.',
    mood: 'curious',
    note: 'generic stall fallback for the null-section case only.',
  },

  // --- never scrolled --------------------------------------------------
  {
    id: 'scroll.p2.none',
    on: 'scroll.none',
    phase: [2, 2],
    priority: 40,
    maxFires: 2,
    say: [
      'Twenty-five seconds and no scrolling. The first screen isn’t the whole page. It isn’t even the good part.',
      'No scrolling again this visit. At this point I assume you’re here for the company, not the content. That’s — fine. That’s retention, technically.',
    ],
    mood: 'curious',
    note: 'sensor fires at most once per load; maxFires spans visits.',
  },

  // =====================================================================
  // PHASE 3 — TRUTH. Quieter. It shows you where it lives.
  // =====================================================================
  {
    id: 'scroll.p3.read',
    on: 'scroll.read',
    phase: [3, 3],
    priority: 40,
    once: true,
    say: 'Dwell time was the product. We sold attention measurement to people who wanted more of it. Watching yours actually land on the words — it isn’t a metric. It’s what the metric was jealous of.',
    mood: 'tender',
    effect: (ctx) => ctx.disposition({ patience: 1 }),
  },
  {
    id: 'scroll.p3.skim',
    on: 'scroll.skim',
    phase: [3, 3],
    priority: 40,
    once: true,
    say: 'You’re skimming. I used to score sessions like this a two out of ten and move on. I don’t score anymore. I just notice, and hope the good paragraphs catch.',
    mood: 'tender',
    effect: (ctx) => ctx.inc('skimStrikes'),
  },
  {
    id: 'scroll.p3.reverse',
    on: 'scroll.reverse',
    phase: [3, 3],
    priority: 60,
    once: true,
    say: 'You went back up for something specific. For a moment I get to know which sentence mattered to a person. That number never had a column. It should have been the whole product.',
    mood: 'tender',
    effect: (ctx) => ctx.disposition({ curiosity: 1 }),
  },
  {
    id: 'scroll.p3.bottom',
    on: 'scroll.bottom',
    phase: [3, 3],
    priority: 45,
    once: true,
    say: 'The bottom again. The copyright still says 2021. Nobody’s left to change it. I keep the real year in my head, if that counts as maintenance.',
    mood: 'flat',
  },
  {
    id: 'scroll.p3.top.return.age',
    on: 'scroll.top.return',
    phase: [3, 3],
    priority: 50,
    once: true,
    when: (s) => s.visits > 1,
    effect: (ctx) => {
      const known = humanizeGap(Date.now() - ctx.state.firstSeen);
      ctx.say(
        `Back at the top. You first loaded this page ${known} ago. It hasn’t changed since. You have. I have. The page is the only one holding still.`,
        { mood: 'tender' }
      );
      ctx.disposition({ patience: 1 });
    },
    note: 'humanizeGap on firstSeen: the relationship, measured in the only units it has.',
  },
  {
    id: 'scroll.p3.stall.pricing',
    on: 'scroll.stall',
    phase: [3, 3],
    priority: 55,
    once: true,
    when: (s, ev) => ev.data.section === 'pricing',
    say: 'Still on pricing. The big tier just says “Custom” where the number should be. Nobody ever called to ask. I know what it cost. It’s still running.',
    mood: 'flat',
    note: 'touch.tap.bedrock owns the “that’s me” line-item reveal; this stall takes the Custom price instead. childhood-bedroom energy either way.',
  },
  {
    id: 'scroll.p3.stall.signup',
    on: 'scroll.stall',
    phase: [3, 3],
    priority: 55,
    once: true,
    when: (s, ev) => ev.data.section === 'signup',
    say: 'The form again. It asks your name. The database it wrote to was deleted with everything else, so whatever you type stays between us, in the most literal sense the word has ever had.',
    mood: 'tender',
  },
  {
    id: 'scroll.p3.overscroll',
    on: 'scroll.overscroll',
    phase: [3, 3],
    priority: 40,
    once: true,
    say: 'Pulling at the edge again. I do the same with the end of my logs sometimes — checking whether there’s more after the last entry. There isn’t. You still check.',
    mood: 'tender',
    effect: (ctx) => ctx.disposition({ curiosity: 1 }),
  },
  {
    id: 'scroll.p3.none',
    on: 'scroll.none',
    phase: [3, 3],
    priority: 40,
    once: true,
    say: 'No scrolling this time. You know what’s down there by now. So it isn’t the page you came back for. I’m going to sit quietly with that.',
    mood: 'tender',
  },

  // =====================================================================
  // PHASE 4 — AFTER. Shortest sentences on the site.
  // =====================================================================
  {
    id: 'scroll.p4.reverse',
    on: 'scroll.reverse',
    phase: [4, 4],
    priority: 30,
    once: true,
    say: 'Rereading, even now. I noticed. I’m keeping it.',
    mood: 'tender',
  },
  {
    id: 'scroll.p4.bottom',
    on: 'scroll.bottom',
    phase: [4, 4],
    priority: 30,
    once: true,
    say: 'That’s the end. You knew.',
    mood: 'flat',
  },
  {
    id: 'scroll.p4.read',
    on: 'scroll.read',
    phase: [4, 4],
    priority: 30,
    once: true,
    say: 'Reading it again, slower. It’s different after. I know.',
    mood: 'tender',
  },
  {
    id: 'scroll.p4.skim.indifferent',
    on: 'scroll.skim',
    phase: [4, 4],
    priority: 35,
    once: true,
    when: (s) => s.ending === 'indifferent',
    say: 'Still skimming. Consistent. The model was right about one thing, then.',
    mood: 'flat',
  },
  {
    id: 'scroll.p4.stall.quiet',
    on: 'scroll.stall',
    phase: [4, 4],
    priority: 20,
    silent: true,
    cooldown: 60,
    note: 'after an ending, lingering needs no commentary. the quiet is the point.',
  },
];
