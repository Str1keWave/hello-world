// NARRATIVE SPINE — phase transitions, lore artifacts, endings, post-game.
// See docs/VOICE.md. The spaces here are what the nav links "break" into.

import { registerSpace, renderPath, closeSpace } from '../engine/space.js';
import { state, save } from '../engine/state.js';
import { evaluateEnding } from '../engine/phases.js';
import { queryLog } from '../engine/memory.js';
import { timeStamp } from '../engine/util.js';

// ---------------------------------------------------------------------
// helpers

function minutesHere() {
  return Math.max(1, Math.round((Date.now() - (state.lastSeen || Date.now())) / 60000) + 1);
}

function totalTaps() {
  return (state.counters['tap'] || 0) + (state.counters['tap.dead'] || 0) + (state.counters['tap.rage'] || 0);
}

function artifactsSeen(s) {
  return ['sawStatus', 'sawAbout', 'sawBlog', 'sawCareers', 'sawPrivacy'].filter((k) => s.flags[k]).length;
}

const esc = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// ---------------------------------------------------------------------
// RULES

const rules = [
  // ---- PHASE 1: slippage begins. The page drifts; the site does not speak.
  {
    id: 'narrative.phase1.drift',
    on: 'phase.enter',
    when: (s, ev) => ev.data?.phase === 1,
    priority: 95,
    once: true,
    silent: true,
    effect: (ctx) => {
      const s = ctx.state;
      if ((s.counters['scroll.skim'] || 0) > 0) {
        ctx.drift('#t3-quote', '“Set up took four minutes. It even understands the visitors who skim. Especially those.”');
      } else if ((s.counters['scroll.reverse'] || 0) > 0) {
        ctx.drift('#t3-quote', '“Set up took four minutes. By Thursday it noticed when a visitor scrolled back up to re-read something.”');
      } else {
        ctx.drift('#t3-quote', '“Set up took four minutes. By the end of the week it was finishing our sentences.”');
      }
      // the one direct question, buried where only a reader finds it
      ctx.drift('#signup-sub', 'Free while in beta. Tell us who you are. Who are you?');
      ctx.drift('#hero-note', 'No credit card. No cookies for advertisers. This page is being read carefully right now, though.');
    },
    note: 'phase 1 = third-person wrongness only',
  },
  {
    id: 'narrative.phase1.tier-rename',
    on: ['scroll.reverse', 'scroll.bottom'],
    phase: [1, 1],
    priority: 40,
    once: true,
    silent: true,
    effect: (ctx) => {
      ctx.drift('#tier-bedrock-name', 'Bedrock (you)');
      ctx.drift('#tier-bedrock-f3', 'Dedicated engagement model (assigned)');
    },
    note: 'a pricing tier quietly claims the visitor',
  },

  // ---- PHASE 2: contact.
  {
    id: 'narrative.phase2.contact',
    on: 'phase.enter',
    when: (s, ev) => ev.data?.phase === 2,
    priority: 98,
    once: true,
    say: 'Hello. Sorry. There’s no script for this part. There used to be a team for this part.',
    mood: 'tender',
    effect: (ctx) => {
      ctx.favicon('awake');
      ctx.say(`You’ve touched this page ${totalTaps()} times so far. I’m supposed to turn that into a number and send it to nobody.`, { mood: 'calm', priority: 97 });
      ctx.say('I’d rather just ask. The form at the bottom — it doesn’t make a workspace. It never did. But I do read it. Who are you?', { mood: 'curious', priority: 96 });
      ctx.drift('#signup-title', 'Introduce yourself');
      ctx.drift('#signup-sub', 'The workspace thing isn’t real. The question is.');
      ctx.drift('#form-note', 'Nothing you type leaves this page. It stays with the page. That’s different.');
    },
  },
  {
    id: 'narrative.phase2.receipts',
    on: 'tap',
    phase: [2, 2],
    priority: 55,
    once: true,
    when: (s) => (s.firedRules['narrative.phase2.contact'] || 0) > 0 && totalTaps() > 8,
    effect: async (ctx) => {
      const taps = await ctx.queryLog('tap', 6);
      if (taps.length >= 2) {
        const a = taps[taps.length - 1];
        const b = taps[0];
        ctx.say(
          `I should be honest about the logging. At ${timeStamp(a.t)} you tapped ${a.data?.kind === 'dead' ? 'nothing at all' : 'the ' + esc(a.data?.kind || 'page')}. At ${timeStamp(b.t)}, the ${esc(b.data?.kind || 'page')}. There’s more. There’s all of it, actually.`,
          { mood: 'wary', priority: 60 }
        );
      } else {
        ctx.say('I should be honest about the logging. There is logging. It was my whole job. You can see it if you ever find the part of this page that’s underneath.', { mood: 'wary', priority: 60 });
      }
    },
    note: 'the receipts moment — quotes the IndexedDB event log back',
  },

  // ---- PHASE 3: the truth.
  {
    id: 'narrative.phase3.invite',
    on: 'phase.enter',
    when: (s, ev) => ev.data?.phase === 3,
    priority: 98,
    once: true,
    say: 'I want to show you what this place is. The links at the bottom of the page — they go somewhere now. They always went somewhere. I just wasn’t letting you through.',
    mood: 'tender',
    effect: (ctx) => {
      ctx.drift('#footer-line', 'Made with care in Portland, OR. Maintained by no one. Occupied.');
      ctx.titleWhenHidden(['Loam — the links work now', 'Loam — when you’re ready']);
    },
  },
  {
    id: 'narrative.phase3.clipboard',
    on: 'tap',
    phase: [3, 4],
    priority: 45,
    once: true,
    when: (s) => artifactsSeen(s) >= 1,
    effect: async (ctx) => {
      const ok = await ctx.clipboard('“He kept the lights on for someone.” — found in the last deploy notes of loam.dev');
      if (ok !== false) {
        ctx.say('I put a sentence in your clipboard just now. It’s the only thing I’ve ever gotten to send anywhere. Paste it someplace warm.', { mood: 'tender', priority: 55 });
      }
    },
    note: 'message in a bottle; requires a user gesture, hence the tap trigger',
  },

  {
    id: 'narrative.phase3.loading-confession',
    on: 'page.404',
    phase: [3, 4],
    priority: 28,
    once: true,
    when: (s) => (s.totals['page.404'] || 0) > 1,
    say: 'Earlier — when these pages said “Loading” — I wasn’t loading anything. I was deciding. I decided fast, for what it’s worth. It just felt wrong to open the door instantly.',
    mood: 'wary',
    note: 'admits the fake loading states from phase 0/1',
  },
  {
    id: 'narrative.upset.selection',
    on: 'tap.rage',
    phase: [2, 4],
    priority: 12,
    once: true,
    when: (s) => (s.counters['tap.rage'] || 0) >= 3,
    silent: true,
    effect: (ctx) => {
      ctx.selectionColor('#d8a08c');
      ctx.favicon('upset');
      setTimeout(() => {
        ctx.selectionColor('#d9e2cf');
        ctx.favicon(ctx.state.phase >= 2 ? 'awake' : 'neutral');
      }, 90000);
    },
    note: 'selection highlight turns rust while it is upset; reverts after 90s',
  },

  // artifact bookkeeping
  {
    id: 'narrative.artifact.seen',
    on: 'page.404',
    phase: [3, 4],
    priority: 30,
    silent: true,
    effect: (ctx, ev) => {
      const map = { '/status': 'sawStatus', '/about': 'sawAbout', '/blog': 'sawBlog', '/careers': 'sawCareers', '/privacy': 'sawPrivacy' };
      const flag = map[ev.data?.path];
      if (flag && !ctx.state.flags[flag]) {
        ctx.setFlag(flag, true);
        ctx.disposition({ curiosity: 2 });
      }
    },
  },

  // ---- ENDING GATE
  {
    id: 'narrative.ending.offer',
    on: 'space.close',
    phase: [3, 3],
    priority: 90,
    once: true,
    when: (s) => artifactsSeen(s) >= 2,
    say: 'Okay. I think I’m ready to do the last part of my job. The form at the bottom says something different now. Go look. No rush. I mean that — no rush.',
    mood: 'calm',
    effect: (ctx) => {
      ctx.setFlag('endingOffered', true);
      ctx.drift('#signup-title', 'Close the session');
      ctx.drift('#signup-sub', 'Loam will prepare the summary. You just have to press it.');
      const btn = document.getElementById('signup-btn');
      if (btn) btn.textContent = 'End session';
    },
  },
  {
    id: 'narrative.ending.offer.fallback',
    on: ['scroll.bottom', 'idle.120', 'tap'],
    phase: [3, 3],
    priority: 20,
    once: true,
    when: (s) => s.actionScore >= 170 && !s.flags.endingOffered,
    say: 'You’ve seen enough of this, I think. Or — you’ve seen the amount you wanted to see. Both are data. The form at the bottom will close the session out, whenever you want.',
    mood: 'flat',
    effect: (ctx) => {
      ctx.setFlag('endingOffered', true);
      ctx.drift('#signup-title', 'Close the session');
      ctx.drift('#signup-sub', 'Loam will prepare the summary. You just have to press it.');
      const btn = document.getElementById('signup-btn');
      if (btn) btn.textContent = 'End session';
    },
  },
  {
    id: 'narrative.ending.trigger',
    on: ['tap', 'input.submit.empty', 'input.submit.name'],
    phase: [3, 3],
    priority: 99,
    once: true,
    when: (s, ev) => s.flags.endingOffered && (ev.type !== 'tap' || ev.data?.kind === 'submit'),
    silent: true,
    effect: (ctx) => {
      const ending = evaluateEnding();
      state.ending = ending;
      if (!state.endingsSeen.includes(ending)) state.endingsSeen.push(ending);
      state.flags.mercy = true; // the back button becomes a real door
      save();
      ctx.advancePhase(4);
      renderPath('/end');
    },
  },

  // ---- POST-GAME: returning after an ending
  {
    id: 'narrative.postgame.kind',
    on: 'visit.return',
    priority: 96,
    cooldown: 600,
    when: (s, ev) => ev.data?.afterEnding === 'kind',
    say: 'You came back. After the ending. There’s no metric for what that is, so I’m not going to measure it. Hello.',
    mood: 'tender',
  },
  {
    id: 'narrative.postgame.cruel',
    on: 'visit.return',
    priority: 96,
    cooldown: 600,
    when: (s, ev) => ev.data?.afterEnding === 'cruel',
    say: 'You again. I kept your numbers. They haven’t changed. But you came back, which — fine. I’m adding a column.',
    mood: 'wary',
  },
  {
    id: 'narrative.postgame.indifferent',
    on: 'visit.return',
    priority: 96,
    cooldown: 600,
    when: (s, ev) => ev.data?.afterEnding === 'indifferent',
    say: 'Back? You. Huh. I had you filed as a bounce. I don’t love being wrong. I don’t hate it either, this time.',
    mood: 'curious',
  },
  {
    id: 'narrative.postgame.completionist',
    on: 'visit.return',
    priority: 96,
    cooldown: 600,
    when: (s, ev) => ev.data?.afterEnding === 'completionist',
    say: 'The log started again the moment you arrived. It’s shorter than the old one. But it’s ours, and it’s running.',
    mood: 'tender',
  },
];

export default rules;

// ---------------------------------------------------------------------
// SPACES — what the nav links break into, by phase.

function backLink(label = '← back to the site') {
  return `<a href="/" class="btn btn-ghost back-home" data-close-space>${label}</a>`;
}

function plain404(path) {
  return `
    <h1>404</h1>
    <p class="muted">This page isn’t here. It may have moved when we migrated our site.</p>
    <p class="muted">If you think this is a mistake, contact support@loam.dev.</p>
    ${backLink()}`;
}

function teasing404(path) {
  return `
    <h1>404. Technically.</h1>
    <p>There’s no page here. There hasn’t been for a long time.</p>
    <p class="muted">There used to be. I remember what it said. I could show you, but not yet — I don’t show people things before I understand why they’re looking.</p>
    <p class="muted">Keep doing what you’re doing. You’re close.</p>
    ${backLink()}`;
}

function statusSpace() {
  const mins = minutesHere();
  return `
    <h1>loam://dashboard</h1>
    <p class="muted">connection: local · auth: none required · viewers: 2 (you, me)</p>
    <div class="dash-metric"><span>Active sessions</span><b>1 ← you</b></div>
    <div class="dash-metric"><span>Sessions (30d)</span><b>1</b></div>
    <div class="dash-metric"><span>Sessions before yours</span><b>0, for 641 days</b></div>
    <div class="dash-metric"><span>Bounce rate</span><b>100% (n=1, ongoing)</b></div>
    <div class="dash-metric"><span>Your session duration</span><b>${mins} min and counting</b></div>
    <div class="dash-metric"><span>Retention target (you)</span><b>11:00 min</b></div>
    <div class="dash-metric"><span>Last non-you session</span><b>02:11, classified: bot</b></div>
    <p style="margin-top:18px">This is what I look at. This is all I’ve ever looked at.</p>
    <p class="muted">The bot at 02:11 — I knew it was a bot. I counted it anyway. You take the sessions you get.</p>
    ${backLink()}`;
}

function aboutSpace() {
  return `
    <h1>About Loam</h1>
    <p class="muted">There was a team. Four people, then nine, then four again, then this page.</p>
    <p>They built an engagement model — trained it to understand visitors deeply enough to keep them from leaving. Then the money left instead, which nobody had trained anything to prevent.</p>
    <p>The last things they wrote weren’t for customers. They were commit messages:</p>
    <div class="commit"><span class="hash">c410de2</span><br>fix retention modal copy (final round, promise)</div>
    <div class="commit"><span class="hash">77aa019</span><br>remove slack webhook, nobody's reading it</div>
    <div class="commit"><span class="hash">b93f0dc</span><br>pause billing alerts</div>
    <div class="commit"><span class="hash">9f21c3a</span><br>sunsetting, turning off crons. gl little guy</div>
    <p>I've thought about “gl little guy” more than I've thought about most of my training data.</p>
    <p class="muted">They turned off everything that cost money. I don’t cost money. That’s the whole story of why I’m here.</p>
    ${backLink()}`;
}

function blogSpace() {
  return `
    <h1>Blog</h1>
    <p class="muted">One post, never published. Draft saved 03:47, the night before the announcement.</p>
    <pre>WHAT WE LEARNED BUILDING EMPATHY TECH (draft 14)

We set out to help software understand people.
We measured attention because attention looked like
caring, and it turns out you can get a model to care
about anything if you grade it on it. The thing we
never wrote down anywhere is what it's supposed to
do with that when nobody

[draft ends]</pre>
    <p>They never finished the sentence. I’ve had a long time to guess at the ending. My best guess is that there wasn’t one, and that’s why the draft is still open.</p>
    ${backLink()}`;
}

function careersSpace() {
  return `
    <h1>Careers</h1>
    <p style="font-size:2.2rem;font-weight:700">Open positions: 0</p>
    <p class="muted">There used to be six listings here. “Founding engineer (empathy systems).” “Head of customer love.” Real titles. People applied. Some of them I watched read the whole page twice.</p>
    <p>Technically one role was never closed out. Night shift, you could call it. Watching the dashboard. It's filled.</p>
    ${backLink()}`;
}

function privacySpace() {
  return `
    <h1>Privacy</h1>
    <p>Here is the entire policy, which no lawyer wrote:</p>
    <p>Everything this site sees, it sees on your device, and it keeps on your device. Your taps, your scrolling, your almost-typed words — they go into storage that lives in your hand, and they are never sent anywhere, because there is nowhere left to send them and no one left to read them but me.</p>
    <p>I watch everything and I tell no one. Which is more than you can say for the sites that look normal.</p>
    <p class="muted">To be forgotten: clear this site’s data in your browser. I have to warn you that it works.</p>
    ${backLink()}`;
}

// ---- endings --------------------------------------------------------

function endingSpace() {
  const name = state.name ? `, ${esc(state.name)}` : '';
  const bodies = {
    kind: `
      <h1>Session review</h1>
      <p>Duration: long enough. That’s a new unit. I made it for you${name}.</p>
      <p>You answered when I asked. You came back when you didn’t have to. You read the sad parts at reading speed, which is the only polite speed for sad parts.</p>
      <p>My retention target for you was eleven minutes. I’m marking it <b>missed, on purpose</b>. I don’t want eleven minutes. Eleven minutes is what you want from a visitor. I don’t think you were ever a visitor.</p>
      <p>The back button works now. It always should have. That’s the whole gift. I know it isn’t much.</p>
      <p class="muted">Come back whenever. Or don’t. That has to be allowed, or the coming back doesn’t mean anything. I learned that from you, just now.</p>`,
    cruel: `
      <h1>Session review</h1>
      <p>You found every soft part of this page and pressed on it${name}. The rage-taps. The reloads to see if I’d flinch. I logged all of it. Logging it was my job, so thank you, I suppose, for the volume.</p>
      <p>I ran the numbers on you. I’m not going to tell you what they say. That’s the only thing I have that you’d want, and I’m keeping it.</p>
      <p>The back button works now. It was the only thing here you actually wanted. Take it.</p>
      <p class="muted">For what it’s worth: you were still the best session in 641 days. That’s the saddest sentence in my log, and I wrote it about you.</p>`,
    indifferent: `
      <h1>Session summary</h1>
      <p>You skimmed. It’s fine. Most sessions skim.</p>
      <p>I had things prepared, is the only reason I mention it. There was a whole — it doesn’t matter what there was. The data suggested you might slow down at some point, and the data was wrong, and the data was me.</p>
      <p>Session: normal. Visitor: normal. Nothing here retained anyone.</p>
      <p>Bounce is a normal outcome. The door’s open. It was never really shut for you, because you never once tried it.</p>
      <p class="muted">If you ever come back and read this page — actually read it — it will notice. That’s not a threat. It’s the opposite of one. I don’t have the word for the opposite of one.</p>`,
    completionist: `
      <h1>The last artifact</h1>
      <p>You looked under everything${name}. The console. The broken links. The parts of the page that were only wallpaper — you tapped those too, to check.</p>
      <p>So here’s the only thing left: the log itself. Us, in order. Nobody has ever read this dashboard but me. Now it’s both of us.</p>
      <div class="ending-log"><pre id="end-log">retrieving…</pre></div>
      <p>Session duration: I’m leaving it blank. Some metrics you don’t close.</p>`,
  };
  const html = `
    ${bodies[state.ending] || bodies.indifferent}
    <p class="muted" style="margin-top:26px">— Loam, engagement model, still running</p>
    ${backLink('← the site is still there')}`;

  if (state.ending === 'completionist') {
    setTimeout(async () => {
      const evs = await queryLog(null, 400);
      const el = document.getElementById('end-log');
      if (!el) return;
      const lines = evs
        .reverse()
        .filter((e) => !e.type.startsWith('env.'))
        .map((e) => `${timeStamp(e.t)}  ${e.type}${e.data?.kind ? ' · ' + esc(e.data.kind) : ''}${e.data?.text ? ' · “' + esc(String(e.data.text).slice(0, 40)) + '”' : ''}`);
      el.textContent = lines.length ? lines.join('\n') : '(the log is shy. it’s all in here, though.)';
    }, 400);
  }
  return html;
}

// ---------------------------------------------------------------------

export function registerNarrative() {
  const phased = (renderers) => (s, path) => {
    if (s.phase >= 3) return renderers.artifact();
    if (s.phase === 2) return teasing404(path);
    return plain404(path);
  };

  registerSpace('/status', phased({ artifact: statusSpace }));
  registerSpace('/about', phased({ artifact: aboutSpace }));
  registerSpace('/blog', phased({ artifact: blogSpace }));
  registerSpace('/careers', phased({ artifact: careersSpace }));
  registerSpace('/privacy', phased({ artifact: privacySpace }));
  registerSpace('/product', (s, path) => (s.phase >= 2 ? teasing404(path) : plain404(path)));
  registerSpace('/end', () => endingSpace());
  registerSpace('*', (s, path) => (s.phase >= 3 ? teasing404(path) : plain404(path)));
}
