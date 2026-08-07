// The nine movements. Action-gated; no clocks. See DESIGN.md + rulings.
import { on, emit } from './events.js';
import { T } from './tunables.js';
import { P, mark } from './persist.js';
import * as skin from './skin.js';
import * as stage from './stage.js';
import * as lang from './language.js';
import * as nerves from './nerves.js';
import * as play from './play.js';
import { motifBank } from './touch.js';

let M = 1; // current movement
let gestureCount = 0;
let echoCount = 0;
let variationOffered = false;
let initiated = false;
let exchanges = 0;
let jokeDone = false;
let firstTouchSeen = false;
let curriculum = ['YOU', 'STILL', 'HIGHWATER', 'HOME'];
let ostensionBusy = false;
let giftEl = null;
let shards = [];
let mergedShards = 0;
let lastRest = 0;
let awaitingGoodbye = false;

const anyGesture = ['gesture.tap', 'gesture.hardtap', 'gesture.flick', 'gesture.stroke', 'gesture.hold'];

export function startArc() {
  M = P().movement || 1;
  if (P().ended) return mountEnded();
  if (P().broken && !P().repaired) M = 6;
  applyMovement();

  // first-contact beat: the dodge, before anything else can react (P2)
  on('touch.down', (d) => {
    if (firstTouchSeen) return;
    firstTouchSeen = true;
    stage.dodgeNear(d.x, d.y);
    skin.excite(d.x, d.y, 0.5);
  });

  // idle attract at ~4s if untouched (P2)
  setTimeout(() => {
    if (!firstTouchSeen) skin.setArousal(0.45);
  }, 4000);

  for (const g of anyGesture) {
    on(g, () => {
      gestureCount += 1;
      tick();
    });
  }

  on('play.swap', () => M === 2 && advance(3));
  on('play.offerIgnored', (d) => {
    if (M === 2 && d.n >= 3 && gestureCount >= T.arc.m2SustainedEvents) advance(3);
  });

  // echo -> vary -> initiate (movement 3)
  on('motif.tap', (d) => {
    if (M < 3) return;
    echoCount += 1;
    echoTap(d.pattern);
    maybeInitiate();
  });
  on('motif.stroke', (d) => {
    if (M < 3) return;
    echoCount += 1;
    echoStroke(d.shape);
    maybeInitiate();
  });

  // SLACK is the one stillness-born word (P4)
  on('gesture.hold', async (d) => {
    if (M === 4 && !lang.floatingWords().has('SLACK')) {
      await breathe(d);
      lang.spendWord('SLACK', { revocable: true });
      await lang.utter(['SLACK'], { at: { x: d.x + 70, y: d.y - 50 } });
      rest(4);
    } else if (M === 8) {
      await breathe(d);
      await theName(d);
    } else if (M >= 3) {
      breathe(d);
    }
  });

  // revocable era: a startle repossesses slack
  on('nerves.startle', () => {
    if (M === 4 && lang.floatingWords().has('SLACK') && !P().gaps.includes('SLACK')) {
      lang.repossess('SLACK');
    }
  });

  on('word.ratified', () => {
    ostensionBusy = false;
    if (M === 3 && P().ratified.length >= T.arc.ratifyForSlack) advance(4);
    else if (M === 3) queueOstension();
  });

  // slack survives one further exchange -> midpoint
  on('speech.done', () => {
    if (M === 4 && (P().used['SLACK'] || 0) >= 2) advance(5);
  });

  on('play.collision', () => {
    if (M >= 5 && M < 7 && P().toyGifted && !P().broken) theBreak();
  });

  tick();
}

function tick() {
  if (M === 1 && gestureCount >= T.arc.m1Events) advance(2);
  if (M === 3 && !ostensionBusy && initiated) queueOstension();
  if (M === 5 && !P().toyGifted && gestureCount > 4) giveGift();
  if (M === 7 && exchanges >= T.arc.fluencyExchanges) advance(8);
  // cadence guarantee: a rest is never far away
  if (Date.now() - lastRest > T.arc.restMaxGapMs && M > 1 && M < 9) rest(M);
}

function advance(n) {
  if (n <= M) return;
  M = n;
  mark({ movement: M });
  emit('arc.movement', { n: M });
  applyMovement();
  rest(M - 1);
}

function applyMovement() {
  play.setPlayEnabled(M >= 2 && !(P().broken && !P().repaired));
  if (M === 3 && !initiated) initiated = false;
  if (M >= 3 && M !== 6) setTimeout(queueOstension, 3000);
  if (M === 5 && !P().gaps.includes('OBSERVED')) setTimeout(midpointSpend, 5000);
  if (M === 7) setTimeout(fluencyLoop, 4000);
  if (M === 9 && !P().ended) setTimeout(goodbye, 2500);
}

// creature-side rests (P4: no visitor stillness required)
function rest(n) {
  lastRest = Date.now();
  skin.setBreath(0.1, 0.8);
  skin.moveLocus(innerWidth * 0.7, innerHeight * 0.75, 0.2);
  emit('arc.rest', { n });
}

async function breathe(d) {
  // wavefront intimacy: rings + deformation AROUND the finger (P5)
  for (let i = 0; i < 3; i++) {
    setTimeout(() => skin.ringAt(d.x, d.y, 0.35 + i * 0.15), i * 900);
  }
  skin.leanTo(d.x, d.y, 0.8);
  skin.moveLocus(d.x, d.y - 40, 0.5);
  return new Promise((r) => setTimeout(r, 2200));
}

// --- movement 3 machinery -------------------------------------------
function echoTap(pattern) {
  const l = skin.locus();
  const jig = () => 1 + (Math.random() - 0.5) * 0.24; // imperfect on purpose
  let t = 400;
  const seq = variationOffered || echoCount < 3 ? pattern : [...pattern, pattern[pattern.length - 1]];
  for (const gap of seq) {
    setTimeout(() => skin.ringAt(l.x, l.y, 0.6), t);
    t += gap * jig();
  }
  if (echoCount >= 3) variationOffered = true;
}

function echoStroke(shape) {
  const l = skin.locus();
  let p = 0;
  const iv = setInterval(() => {
    p += 0.04;
    if (p >= 1) return clearInterval(iv);
    const i = Math.floor(p * (shape.length - 1));
    const pt = shape[i];
    skin.pseudopod(l.x, l.y, l.x + pt.x * 120 - 60, l.y + pt.y * 120 - 60, p);
  }, 30);
}

function maybeInitiate() {
  if (initiated || echoCount < 4) return;
  const first = motifBank().first || (P().firstMotif ? P().firstMotif : null);
  if (!first) return;
  initiated = true;
  mark({ firstMotif: first });
  setTimeout(() => {
    if (first.kind === 'tap' || first.pattern) echoTap(first.pattern || [220, 220]);
    else if (first.shape) echoStroke(first.shape);
    emit('arc.movement', { n: M, initiation: true });
  }, 2600);
}

function queueOstension() {
  if (ostensionBusy || M === 6 || P().ended) return;
  const next = curriculum.find((w) => !P().ratified.includes(w));
  if (!next) return;
  ostensionBusy = true;
  lang.ostend(next).then((ok) => {
    ostensionBusy = false;
    if (!ok) setTimeout(queueOstension, 12000);
  });
}

// --- movement 5: the midpoint spend ---------------------------------
async function midpointSpend() {
  if (P().gaps.includes('OBSERVED') || M !== 5) return;
  lang.spendWord('OBSERVED', { revocable: false });
  await new Promise((r) => setTimeout(r, 1400));
  lang.discardWord('PREDICTED');
  await new Promise((r) => setTimeout(r, 1800));
  const yours = P().ratified[0] || 'YOU';
  await lang.utter([yours, 'OBSERVED']);
  rest(5);
}

function giveGift() {
  // the gift is its most expensive word: OBSERVED, handed to you to carry
  const f = lang.floatingWords().get('OBSERVED');
  if (!f) return;
  giftEl = f.el;
  play.carryGift(giftEl);
  mark({ toyGifted: true });
  const r = giftEl.getBoundingClientRect();
  skin.ringAt(r.left + 20, r.top, 0.6);
}

// --- movement 6: the break ------------------------------------------
function theBreak() {
  mark({ broken: true });
  emit('arc.break', {});
  play.setPlayEnabled(false);
  const r = giftEl.getBoundingClientRect();
  giftEl.style.opacity = '0';
  // 600ms tableau BEFORE the reaction (P6): shards fall slow, watched
  play.stopCarry();
  shards = [];
  mergedShards = 0;
  const pieces = ['obs', 'erv', 'ed'];
  pieces.forEach((txt, i) => {
    const s = document.createElement('span');
    s.className = 'shard';
    s.textContent = txt;
    s.style.transform = `translate(${r.left + i * 6}px, ${r.top}px)`;
    document.getElementById('loose').appendChild(s);
    shards.push(s);
    setTimeout(() => {
      s.style.transform = `translate(${r.left - 40 + i * 44 + (Math.random() * 16 - 8)}px, ${r.top + 60 + Math.random() * 40}px)`;
    }, 60);
  });
  setTimeout(() => {
    skin.flickerStruggle(true);
    nerves.sensitize(1.6);
    mountRepair();
  }, 900);
}

function mountRepair() {
  // shards want reassembly (P7): they glow; dragging them together merges
  shards.forEach((s) => s.classList.add('wanting'));
  const offMove = on('gesture.strokeMove', (d) => {
    for (const s of shards) {
      if (s.dataset.merged) continue;
      const r = s.getBoundingClientRect();
      if (Math.abs(d.x - r.left) < 46 && Math.abs(d.y - r.top) < 46) {
        s.style.transform = `translate(${d.x - 6}px, ${d.y - 30}px)`;
      }
    }
    // merge check: any two unmerged shards close together
    for (let i = 0; i < shards.length; i++) {
      for (let j = i + 1; j < shards.length; j++) {
        const a = shards[i], b = shards[j];
        if (a.dataset.merged || b.dataset.merged) continue;
        const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        if (Math.abs(ra.left - rb.left) < 26 && Math.abs(ra.top - rb.top) < 26) {
          b.dataset.merged = '1';
          b.style.opacity = '0';
          a.textContent += '·';
          mergedShards += 1;
          // legible progress within two touches (P7): a peek per merge
          skin.moveLocus(ra.left, ra.top - 60, 0.6);
          skin.ringAt(ra.left, ra.top, 0.5);
          if (mergedShards >= T.arc.repairShards - 1) finishRepair(a, offMove);
        }
      }
    }
  });
}

function finishRepair(lastShard, offMove) {
  offMove();
  const l = skin.locus();
  lastShard.style.transform = `translate(${l.x}px, ${l.y}px)`;
  setTimeout(() => {
    lastShard.remove();
    shards.forEach((s) => s.remove());
    // the word made whole again — it keeps it close now
    if (giftEl) {
      giftEl.style.opacity = '1';
      giftEl.style.transform = `translate(${l.x - 30}px, ${l.y - 24}px)`;
    }
    skin.flickerStruggle(false);
    mark({ repaired: true });
    emit('arc.repaired', {});
    advance(7);
  }, 1100);
}

// --- movement 7: fluency loop ---------------------------------------
async function fluencyLoop() {
  if (M !== 7 || P().ended) return;
  if (!jokeDone && exchanges === 1) {
    jokeDone = true;
    // deliberate misuse, then self-correction: its first joke. Fluency-era
    // speech spends freely — post-Break it has stopped protecting cover.
    const toy = play.toyPos();
    spendIfNeeded('HIGHWATER');
    await lang.utter(['HIGHWATER'], { at: { x: toy.x, y: toy.y - 50 } });
    await new Promise((r) => setTimeout(r, 700));
    spendIfNeeded('LOWWATER');
    await lang.utter(['LOWWATER'], { at: { x: toy.x, y: toy.y - 50 } });
  }
  // question-game: word + querying rhythm; any gesture answers
  const w = P().ratified[exchanges % Math.max(1, P().ratified.length)] || 'STILL';
  spendIfNeeded(w);
  await lang.utter([w]);
  const off = on('gesture.tap', bump);
  const offS = on('gesture.stroke', bump);
  function bump() {
    off();
    offS();
    exchanges += 1;
    skin.excite(innerWidth / 2, innerHeight / 2, 0.5);
    setTimeout(fluencyLoop, 5000);
    tick();
  }
}

function spendIfNeeded(wordId) {
  // words are pried, never conjured (P10): pay before speaking
  if (!lang.floatingWords().has(wordId) && !P().gaps.includes(wordId)) {
    lang.spendWord(wordId, { revocable: false });
  }
}

// --- movement 8: the name -------------------------------------------
async function theName(d) {
  if (P().named) return;
  await lang.headerSpend();
  const first = P().firstMotif;
  if (first && first.pattern) echoTap(first.pattern);
  advance(9);
}

// --- movement 9: it says goodbye first ------------------------------
async function goodbye() {
  if (P().ended) return;
  const first = P().firstMotif;
  if (first && first.pattern) {
    echoTap(first.pattern);
    await new Promise((r) => setTimeout(r, 2000));
  }
  await lang.utter(['SLACK']);
  await new Promise((r) => setTimeout(r, 800));
  lang.returnSlack();
  await new Promise((r) => setTimeout(r, 1400));
  // withdraws warmly, first — alive at rest, not gone (P13)
  skin.moveLocus(innerWidth * 0.8, innerHeight * 0.9, 0.15);
  skin.setBreath(0.08, 0.9);
  skin.setArousal(0.1);
  mark({ ended: true });
  emit('arc.ended', {});
  mountEnded();
}

function mountEnded() {
  // recognition, nothing more: gentle acknowledgment rings on touch
  skin.setBreath(0.08, 0.9);
  on('touch.down', (d) => skin.ringAt(d.x, d.y, 0.25));
  const firstWord = P().ratified[0];
  if (firstWord) {
    setTimeout(() => {
      const r = stage.wordRect(firstWord);
      if (r) {
        stage.trembleWord(firstWord, true);
        setTimeout(() => stage.trembleWord(firstWord, false), 1600);
      }
    }, 1800);
  }
}

export function currentMovement() {
  return M;
}
