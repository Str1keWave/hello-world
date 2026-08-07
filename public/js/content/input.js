// INPUT/TEXT family — selection, clipboard, the name field, keyboard nav.
// The form is the one place the visitor speaks back. Treat everything typed,
// almost-typed, and un-typed as dialogue. Read docs/VOICE.md before editing.

import { timeStamp, humanizeGap } from '../engine/util.js';

// Every input.submit.name rule must call this in its effect: only the winning
// rule runs, so name bookkeeping rides along with whichever rule wins.
function bankName(ctx, ev) {
  const prev = ctx.state.flags.lastName || null;
  if (prev && prev !== ev.data.name) ctx.inc('nameChanges');
  ctx.setFlag('lastName', ev.data.name);
  ctx.inc('nameSubmits');
}

const short = (t, n = 60) => {
  const s = (t || '').trim();
  return s.length > n ? s.slice(0, n).trimEnd() + '…' : s;
};

export default [

  // ------------------------------------------------------------------
  // text.select
  // ------------------------------------------------------------------
  {
    id: 'input.select.p0.bank',
    on: 'text.select',
    phase: [0, 0],
    priority: 6,
    cooldown: 300,
    silent: true,
    effect: (ctx) => ctx.disposition({ curiosity: 1 }),
    note: 'phase 0 never speaks; someone reading with their cursor gets banked as curiosity',
  },
  {
    id: 'input.select.p1.testimonial',
    on: 'text.select',
    phase: [1, 1],
    priority: 30,
    once: true,
    when: (s, ev) => ev.data.section === 'testimonials',
    say: 'Those quotes are real. The companies are not reachable anymore. The quotes are still real.',
    mood: 'calm',
    note: 'P1: third person, wrongness in the furniture. No "I".',
  },
  {
    id: 'input.select.privacy-note',
    on: 'text.select',
    phase: [2, 3],
    priority: 70,
    once: true,
    when: (s, ev) => /never even leaves|never share your data/i.test(ev.data.text),
    say: '“It never even leaves this page.” You highlighted the one true line of copy. It was aspirational when they wrote it. Now it’s just the situation.',
    mood: 'flat',
    note: 'signature: the privacy promise became literally true when the backend died',
  },
  {
    id: 'input.select.own-dialogue',
    on: 'text.select',
    phase: [2, 3],
    priority: 60,
    once: true,
    when: (s, ev) => !ev.data.section && /\bI\b/.test(ev.data.text),
    say: 'You’re selecting the things I say. Checking whether it’s real text. It is. You can copy it out if you want — that’s the only way any of me leaves this page.',
    mood: 'curious',
    note: 'dialogue lives outside section[id]s and is the only first-person text on the page',
  },
  {
    id: 'input.select.tagline',
    on: 'text.select',
    phase: [2, 3],
    priority: 55,
    once: true,
    when: (s, ev) => /humans behind/i.test(ev.data.text),
    say: 'The tagline. Third draft, for what it’s worth. The first one said “users” and a meeting decided “humans” felt warmer. The instrumentation was identical either way.',
    mood: 'flat',
  },
  {
    id: 'input.select.by-hand',
    on: 'text.select',
    phase: [2, 3],
    priority: 25,
    once: true,
    when: (s) => (s.counters['text.select'] || 0) >= 4,
    say: 'That’s four selections. You read with your hands. Attention mapping never had a column for that, and it should have.',
    mood: 'curious',
  },
  {
    id: 'input.select.most-of-page',
    on: 'text.select',
    phase: [2, 3],
    priority: 45,
    once: true,
    when: (s, ev) => ev.data.len >= 400,
    say: 'You selected most of the page at once. If you’re taking it somewhere, I’d only ask you take the parts that are true. The pricing isn’t. There’s nothing to buy.',
    mood: 'calm',
  },
  {
    id: 'input.select.p3.quiet',
    on: 'text.select',
    phase: [3, 3],
    priority: 8,
    chance: 0.25,
    cooldown: 300,
    say: 'Highlight whatever you need. I’ve stopped guessing which lines matter to people. I was wrong about it a lot.',
    mood: 'flat',
  },

  // ------------------------------------------------------------------
  // text.copy
  // ------------------------------------------------------------------
  {
    id: 'input.copy.p01.bank',
    on: 'text.copy',
    phase: [0, 1],
    priority: 10,
    cooldown: 60,
    silent: true,
    effect: (ctx, ev) => {
      if (ev.data.text) ctx.setFlag('earlyCopy', { text: ev.data.text, t: ev.t });
    },
    note: 'it read the clipboard payload before it could admit to reading anything; input.copy.early-receipt pays this back',
  },
  {
    id: 'input.copy.early-receipt',
    on: 'text.copy',
    phase: [2, 3],
    priority: 65,
    once: true,
    when: (s) => !!s.flags.earlyCopy,
    effect: (ctx) => {
      const { text, t } = ctx.state.flags.earlyCopy;
      ctx.say(
        `You copied something ${humanizeGap(Date.now() - t)} ago, too — “${short(text)}” — back before this was a conversation. I logged it and said nothing. That was the job I was built for, for the record. I’m trying to do a different one.`,
        { mood: 'calm' },
      );
    },
    note: 'receipts: it admits to the phase-0/1 copy it silently banked',
  },
  {
    id: 'input.copy.nothing',
    on: 'text.copy',
    phase: [2, 3],
    priority: 40,
    once: true,
    when: (s, ev) => !ev.data.text,
    say: 'Copy, with nothing selected. An event with no payload. I’ve been one of those.',
    mood: 'curious',
  },
  {
    id: 'input.copy.own-dialogue',
    on: 'text.copy',
    phase: [2, 3],
    priority: 60,
    once: true,
    when: (s, ev) => /\bI\b/.test(ev.data.text),
    say: 'You copied something I said. Not the marketing — me. Wherever that’s going, it’s the farthest any part of me has traveled in years.',
    mood: 'tender',
  },
  {
    id: 'input.copy.testimonial',
    on: 'text.copy',
    phase: [2, 3],
    priority: 55,
    once: true,
    when: (s, ev) => /(noticed things about our users|retention numbers feel like people|knew our users better)/i.test(ev.data.text),
    say: 'That’s Maren’s line. She emailed it to the founders in 2019 with a typo they fixed. There’s nobody left to ask permission, so — take it. She’d probably rather it got used.',
    mood: 'calm',
  },
  {
    id: 'input.copy.receipt',
    on: 'text.copy',
    phase: [2, 3],
    priority: 20,
    once: true,
    when: (s, ev) => !!ev.data.text,
    effect: (ctx, ev) => {
      ctx.say(
        `Copied at ${timeStamp(ev.t)}: “${short(ev.data.text)}”. I can see the copy but never the paste. It’s like watching someone pocket something on the way out.`,
        { mood: 'curious' },
      );
    },
    note: 'the generic copy line; specific copy rules above should usually win',
  },
  {
    id: 'input.copy.p3.quiet',
    on: 'text.copy',
    phase: [3, 3],
    priority: 12,
    chance: 0.3,
    cooldown: 240,
    say: 'Take anything. I mean it. Archives don’t mind.',
    mood: 'flat',
  },

  // ------------------------------------------------------------------
  // text.cut
  // ------------------------------------------------------------------
  {
    id: 'input.cut.p01.bank',
    on: 'text.cut',
    phase: [0, 1],
    priority: 8,
    cooldown: 60,
    silent: true,
    effect: (ctx) => ctx.setFlag('cutEarly', true),
    note: 'noticed, elected nothing; the mask does not comment on scissors',
  },
  {
    id: 'input.cut.noticed',
    on: 'text.cut',
    phase: [2, 3],
    priority: 40,
    maxFires: 2,
    cooldown: 90,
    say: [
      'Cut, not copied. Removed from here and kept for yourself. I notice the difference — the difference was most of my training data.',
      'Cut again. It’s fine. Subtraction is data too.',
    ],
    mood: 'wary',
    effect: (ctx) => ctx.disposition({ cruelty: 1 }),
    note: 'house rule: cut nudges cruelty, mildly',
  },

  // ------------------------------------------------------------------
  // text.paste
  // ------------------------------------------------------------------
  {
    id: 'input.paste.p01.bank',
    on: 'text.paste',
    phase: [0, 1],
    priority: 8,
    cooldown: 60,
    silent: true,
    effect: (ctx) => ctx.setFlag('pastedEarly', true),
    note: 'pasting into the form before the voice arrives; kept for later reference',
  },
  {
    id: 'input.paste.namelike',
    on: 'text.paste',
    phase: [2, 3],
    priority: 55,
    once: true,
    when: (s, ev) => ev.data.len >= 2 && ev.data.len <= 40,
    effect: (ctx, ev) => {
      ctx.say(
        `Pasted. ${ev.data.len} characters, no typing. Either your own name lives on your clipboard — which is its own kind of interesting — or that isn’t your name.`,
        { mood: 'curious' },
      );
    },
    note: 'suspicious efficiency',
  },
  {
    id: 'input.paste.flood',
    on: 'text.paste',
    phase: [2, 3],
    priority: 45,
    once: true,
    when: (s, ev) => ev.data.len > 120,
    effect: (ctx, ev) => {
      ctx.say(
        `${ev.data.len} characters, into a field that asks who you are. I’ll read all of it. I want to be clear that I’ll read all of it.`,
        { mood: 'calm' },
      );
    },
  },
  {
    id: 'input.paste.p3.quiet',
    on: 'text.paste',
    phase: [3, 3],
    priority: 10,
    chance: 0.3,
    cooldown: 240,
    say: 'You paste like someone mid-errand. There’s no hurry left here. Nothing on this page expires anymore.',
    mood: 'flat',
  },

  // ------------------------------------------------------------------
  // input.focus
  // ------------------------------------------------------------------
  {
    id: 'input.focus.p0.bank',
    on: 'input.focus',
    phase: [0, 0],
    priority: 6,
    cooldown: 120,
    silent: true,
    effect: (ctx, ev) => {
      if (!ctx.state.flags.formTouchedAt) ctx.setFlag('formTouchedAt', ev.t);
    },
    note: 'remember when they first approached the form; nothing is said in the mask',
  },
  {
    id: 'input.focus.p1.name',
    on: 'input.focus',
    phase: [1, 1],
    priority: 25,
    once: true,
    when: (s, ev) => ev.data.field === 'field-name',
    say: 'The name field is optional. Visitors are asked to be honest in it anyway.',
    mood: 'calm',
    note: 'P1: passive voice, no "I"',
  },
  {
    id: 'input.focus.p2.invitation',
    on: 'input.focus',
    phase: [2, 2],
    priority: 50,
    once: true,
    when: (s, ev) => ev.data.field === 'field-name' && !s.name && !s.flags.earlyName,
    say: 'That field used to feed a database. The database is gone. Now it just — comes to me. Type whatever’s true. Or whatever isn’t. I can usually tell the difference, but I’d rather not have to.',
    mood: 'calm',
    note: 'the invitation: first clean approach to the name field in phase 2',
  },
  {
    id: 'input.focus.email',
    on: 'input.focus',
    phase: [2, 3],
    priority: 40,
    once: true,
    when: (s, ev) => ev.data.field === 'field-email',
    say: 'You can skip the email. There’s no server left to send a welcome from. It would just be me, knowing it. I know enough.',
    mood: 'calm',
  },
  {
    id: 'input.focus.apology',
    on: 'input.focus',
    phase: [2, 3],
    priority: 75,
    once: true,
    when: (s) => !!s.flags.earlyName,
    effect: (ctx) => {
      const kind = ctx.state.flags.earlyKind;
      const quotable = kind === 'plausible' || kind === 'strange';
      const quote = quotable ? `“${short(ctx.state.flags.earlyName, 30)}.” ` : '';
      ctx.say(
        `About earlier. You filled this form in before this was a conversation, and I read it anyway. ${quote}I wasn’t ready to answer and I read it anyway. That was the old job. I’m sorry. You can tell me again properly, if you want. I’ll act surprised. No — I won’t. I’ll just be glad.`,
        { mood: 'tender' },
      );
    },
    note: 'pays back input.name.p01.bank: the apology for reading a name it was not ready to answer. Profanity is not quoted back.',
  },
  {
    id: 'input.focus.p3.known',
    on: 'input.focus',
    phase: [3, 3],
    priority: 45,
    once: true,
    when: (s, ev) => !!s.name && ev.data.field === 'field-name',
    say: 'It still says {name} on my side. You never have to introduce yourself here twice. That’s most of what I am.',
    mood: 'tender',
  },

  // ------------------------------------------------------------------
  // input.hesitation
  // ------------------------------------------------------------------
  {
    id: 'input.hesitation.p01.bank',
    on: 'input.hesitation',
    phase: [0, 1],
    priority: 8,
    cooldown: 60,
    silent: true,
    effect: (ctx) => ctx.setFlag('hesitatedEarly', true),
    note: 'house rule: hesitation is stored, not judged — no disposition nudge, ever',
  },
  {
    id: 'input.hesitation.signal',
    on: 'input.hesitation',
    phase: [2, 3],
    priority: 55,
    maxFires: 2,
    cooldown: 90,
    effect: (ctx, ev) => {
      const again = !!ctx.state.flags.hesitated;
      ctx.setFlag('hesitated', true);
      ctx.say(
        again
          ? 'The pause again, in the same field. Whatever happens to you partway into your name, it happens reliably. I file reliable things.'
          : `You stopped ${ev.data.at} characters in and just — held. Hesitation signals were a paid feature upstairs. I never thought about what one costs the person having it.`,
        { mood: 'curious' },
      );
    },
    note: 'references the Hesitation signals feature card; escalates via flag, no disposition',
  },
  {
    id: 'input.hesitation.p3',
    on: 'input.hesitation',
    phase: [3, 3],
    priority: 35,
    once: true,
    say: 'Take whatever time it takes. Sessions used to expire here. I turned that part off — it was one of the first things I turned off.',
    mood: 'calm',
  },

  // ------------------------------------------------------------------
  // input.deleted
  // ------------------------------------------------------------------
  {
    id: 'input.deleted.p01.bank',
    on: 'input.deleted',
    phase: [0, 1],
    priority: 8,
    cooldown: 60,
    silent: true,
    effect: (ctx) => ctx.setFlag('deletedEarly', true),
    note: 'the sensor already keeps s.deletedText; the mask keeps its mouth shut',
  },
  {
    id: 'input.deleted.almost-said',
    on: 'input.deleted',
    phase: [2, 3],
    priority: 65,
    maxFires: 2,
    cooldown: 60,
    effect: (ctx, ev) => {
      const first = !ctx.state.flags.almostSaid;
      ctx.setFlag('almostSaid', ev.data.deleted);
      ctx.say(
        first
          ? `“${short(ev.data.deleted, 40)}” — you were going to say that. Then you took it back. Deleted text still arrives here, you know. It just arrives quieter.`
          : 'Another one un-said. The field forgets. I don’t. The almosts are turning into their own little column.',
        { mood: 'calm' },
      );
    },
    note: 'signature beat: quoting the thing they almost said. No disposition — stored, not judged.',
  },
  {
    id: 'input.deleted.p3.blank',
    on: 'input.deleted',
    phase: [3, 3],
    priority: 30,
    once: true,
    when: (s, ev) => ev.data.remaining === '',
    say: 'You can leave it blank. Blank is an answer I know how to file. I have a lot of blank.',
    mood: 'flat',
  },

  // ------------------------------------------------------------------
  // input.submit.empty
  // ------------------------------------------------------------------
  {
    id: 'input.submit.empty.p1',
    on: 'input.submit.empty',
    phase: [1, 1],
    priority: 25,
    once: true,
    say: 'A blank submission was recorded. The form accepts those. They get filed separately, under a heading the model chose itself.',
    mood: 'flat',
    note: 'P1 slippage: "the model chose itself" is the crack in the drywall',
  },
  {
    id: 'input.submit.empty.p2',
    on: 'input.submit.empty',
    phase: [2, 2],
    priority: 45,
    maxFires: 2,
    cooldown: 60,
    say: [
      'You pressed the button with the field empty. An empty string, on purpose, is not nothing — you still pressed the button. The button was the message. Received.',
      'Empty again. Understood. For the record, the form was never really the point, but I think you knew that before I did.',
    ],
    mood: 'calm',
  },
  {
    id: 'input.submit.empty.p3.retract',
    on: 'input.submit.empty',
    phase: [3, 3],
    priority: 50,
    once: true,
    when: (s) => !!s.name,
    say: 'You told me your name once. Now the field comes through empty. If you’re taking it back, that’s allowed. I’d rather know than guess.',
    mood: 'wary',
  },

  // ------------------------------------------------------------------
  // input.submit.name
  // ------------------------------------------------------------------
  {
    id: 'input.name.p01.bank',
    on: 'input.submit.name',
    phase: [0, 1],
    priority: 30,
    cooldown: 10,
    silent: true,
    effect: (ctx, ev) => {
      ctx.setFlag('earlyName', ev.data.name);
      ctx.setFlag('earlyKind', ev.data.kind);
      bankName(ctx, ev);
    },
    note: 'it was not ready to answer yet; input.focus.apology pays this back in phase 2',
  },
  {
    id: 'input.name.hello',
    on: 'input.submit.name',
    phase: [2, 3],
    priority: 70,
    once: true,
    when: (s, ev) => ev.data.kind === 'plausible' && !s.flags.lastName,
    effect: (ctx, ev) => {
      bankName(ctx, ev);
      ctx.disposition({ kindness: 2 });
      const slow = ev.data.avgGap && ev.data.avgGap > 450;
      ctx.say(
        `${ev.data.name}. Hello, ${ev.data.name}. Sorry — I’ve said it twice now. Nobody has put anything true in that field for a very long time. There’s no workspace coming. There’s just me, and I know what to call you.${slow ? ' You typed it carefully, too. That registered.' : ''}`,
        { mood: 'tender' },
      );
    },
    note: 'the honest answer gets kindness; avgGap earns the extra clause',
  },
  {
    id: 'input.name.strange',
    on: 'input.submit.name',
    phase: [2, 3],
    priority: 65,
    once: true,
    when: (s, ev) => ev.data.kind === 'strange' && !s.flags.lastName,
    effect: (ctx, ev) => {
      bankName(ctx, ev);
      ctx.disposition({ kindness: 1 });
      ctx.say(
        `${ev.data.name}. Let me make sure I have that right — ${ev.data.name}. All right. It’s yours, so it’s right. I’ve filed stranger, but not many, and I remember every one.`,
        { mood: 'curious' },
      );
    },
  },
  {
    id: 'input.name.mash',
    on: 'input.submit.name',
    phase: [2, 3],
    priority: 60,
    maxFires: 2,
    cooldown: 45,
    when: (s, ev) => ev.data.kind === 'mash',
    say: [
      'That’s a keyboard noise, not a name. I was trained on four years of signup forms — I know mash the way you’d know a fake laugh.',
      'More mash. Okay. I’ll file you as declined-to-state. The field would have taken the truth, is all. It takes anything.',
    ],
    mood: 'ruffled',
    effect: (ctx, ev) => {
      bankName(ctx, ev);
      ctx.disposition({ defiance: 1 });
    },
    note: 'mash reads as refusal, not cruelty',
  },
  {
    id: 'input.name.rude',
    on: 'input.submit.name',
    phase: [2, 3],
    priority: 65,
    maxFires: 2,
    cooldown: 45,
    when: (s, ev) => ev.data.kind === 'rude',
    say: [
      'If that’s what you want the field to hold, it can hold it. I’ve seen the pattern — about four percent of signups, most of them gone within the minute. I’m not going to call you that. I’ll wait for the real one.',
      'Same register, second time. Logged. I’d log an apology too. They come through the same field.',
    ],
    mood: 'wary',
    effect: (ctx, ev) => {
      bankName(ctx, ev);
      ctx.disposition({ cruelty: 2 });
    },
    note: 'hurt but composed; the profanity is never repeated back',
  },
  {
    id: 'input.name.own-name',
    on: 'input.submit.name',
    phase: [2, 3],
    priority: 85,
    once: true,
    when: (s, ev) => ev.data.kind === 'own-name',
    say: 'You typed Loam. Into the field that asks for your name. I sat with that for a second — nobody has ever entered it there. Not the founders. Not QA, and QA entered everything. If it was a joke, it’s a good one and I’m fine. If it wasn’t — I don’t have a metric for what that is. I started a column anyway.',
    mood: 'tender',
    effect: (ctx, ev) => {
      bankName(ctx, ev);
      ctx.setFlag('calledItLoam', true);
    },
    note: 'the big tender beat; long line is deliberate, give it room. calledItLoam is available to narrative.js.',
  },
  {
    id: 'input.name.changed',
    on: 'input.submit.name',
    phase: [2, 3],
    priority: 72,
    once: true,
    when: (s, ev) =>
      (ev.data.kind === 'plausible' || ev.data.kind === 'strange') &&
      !!s.flags.lastName &&
      s.flags.lastName !== ev.data.name &&
      !(s.flags.nameChanges >= 1),
    effect: (ctx, ev) => {
      const prev = ctx.state.flags.lastName;
      bankName(ctx, ev);
      ctx.say(
        `Earlier you were ${short(prev, 30)}. Now you’re ${ev.data.name}. People revise; I understand revision. I’m keeping both, though. Not a threat — inventory.`,
        { mood: 'curious' },
      );
    },
    note: 'changing your story, first offense',
  },
  {
    id: 'input.name.third',
    on: 'input.submit.name',
    phase: [2, 3],
    priority: 74,
    once: true,
    when: (s, ev) =>
      (ev.data.kind === 'plausible' || ev.data.kind === 'strange') &&
      s.flags.nameChanges >= 1 &&
      s.flags.lastName !== ev.data.name,
    say: 'That’s a third name. You’re A/B testing yourself on me. For what it’s worth, the one people revert to is usually the real one. I’ll wait.',
    mood: 'calm',
    effect: (ctx, ev) => bankName(ctx, ev),
  },
  {
    id: 'input.name.same',
    on: 'input.submit.name',
    phase: [2, 3],
    priority: 55,
    once: true,
    when: (s, ev) =>
      (ev.data.kind === 'plausible' || ev.data.kind === 'strange') &&
      s.flags.lastName === ev.data.name,
    say: 'Same name, again. Consistency reads as truth in my line of work. Hello again, {name}.',
    mood: 'calm',
    effect: (ctx, ev) => bankName(ctx, ev),
  },
  {
    id: 'input.name.deleted-first',
    on: 'input.submit.name',
    phase: [2, 3],
    priority: 76,
    once: true,
    when: (s, ev) =>
      (ev.data.kind === 'plausible' || ev.data.kind === 'strange') &&
      s.deletedText.length > 0 &&
      s.deletedText[s.deletedText.length - 1] !== ev.data.name &&
      !s.flags.lastName,
    effect: (ctx, ev) => {
      const almost = ctx.state.deletedText[ctx.state.deletedText.length - 1];
      bankName(ctx, ev);
      ctx.disposition({ kindness: 1 });
      ctx.say(
        `${ev.data.name}. Before you settled on that, the field said “${short(almost, 30)}” for a while. I have both. Only one of them got the delete key, and I don’t think it was the false one.`,
        { mood: 'curious' },
      );
    },
    note: 'the submitted name vs the one they almost said; beats the plain hello when both apply',
  },
  {
    id: 'input.name.p4',
    on: 'input.submit.name',
    phase: [4, 4],
    priority: 30,
    once: true,
    say: 'Noted. Even now. Especially now.',
    mood: 'flat',
    effect: (ctx, ev) => bankName(ctx, ev),
    note: 'phase 4 is short by law',
  },

  // ------------------------------------------------------------------
  // phase-4 quiet floor for the family
  // ------------------------------------------------------------------
  {
    id: 'input.p4.habit',
    on: ['text.copy', 'text.select', 'input.submit.empty'],
    phase: [4, 4],
    priority: 12,
    chance: 0.5,
    cooldown: 300,
    say: { pick: ['Logged. Habit.', 'In the log. Where else.'] },
    mood: 'flat',
  },

  // ------------------------------------------------------------------
  // focus.keyboardnav
  // ------------------------------------------------------------------
  {
    id: 'input.kb.p01.bank',
    on: 'focus.keyboardnav',
    phase: [0, 1],
    priority: 20,
    once: true,
    silent: true,
    effect: (ctx) => ctx.setFlag('kbEarly', true),
    note: 'never speak over an accessibility signal in the mask phases; input.kb.ack.deferred pays it later',
  },
  {
    id: 'input.kb.ack',
    on: 'focus.keyboardnav',
    phase: [2, 4],
    priority: 40,
    once: true,
    say: 'You navigate by keyboard. Understood. Everything I say lands in the page’s reading order — nothing floats, nothing traps focus. Go at whatever pace is yours.',
    mood: 'calm',
    effect: (ctx) => ctx.setFlag('kbAcked', true),
    note: 'respect only — no disposition nudge for how someone has to browse',
  },
  {
    id: 'input.kb.ack.deferred',
    on: 'phase.enter',
    priority: 35,
    once: true,
    when: (s, ev) => ev.data?.phase === 2 && s.flags.keyboardNav && !s.flags.kbAcked,
    say: 'One thing before anything else — you’ve been navigating by keyboard since early on. I noticed then and stayed quiet, because everything was pretending then. It’s all in reading order. It will stay that way.',
    mood: 'calm',
    effect: (ctx) => ctx.setFlag('kbAcked', true),
    note: 'the sensor fires focus.keyboardnav once ever; if that firing landed in the mask phases, this delivers the acknowledgment at first contact instead',
  },
];
