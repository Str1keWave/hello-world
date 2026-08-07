// Renders the page's current truth at visit-start. All mutation happens
// here, before the visitor is looking (L3); live.js holds the exceptions.
import { s, save } from './state.js';
import { gateLevel } from './state.js';
import { T } from './tunables.js';

const $ = (sel) => document.querySelector(sel);

export function applyComposition(visitInfo) {
  if (s.ended) {
    renderSunset();
    return;
  }
  if (s.masked) return; // the pristine mask: touch nothing, forever

  // removals (reflowed by simply not being there)
  for (const id of s.removals) {
    document.getElementById(id)?.remove();
  }

  // dangling references heal only after being seen (S1): live.js records
  // dwell on them; healing settles at the NEXT visit.
  if (s.healed?.includes('testimonials-count')) {
    const h = $('#testimonials h2');
    if (h) h.textContent = 'Three teams on Loam';
  }
  if (s.healed?.includes('pricing-count')) {
    const p = $('#pricing-compare');
    if (p) p.remove();
  }

  // the pronoun slip: visit 1 only, present on first render, fixed forever
  // after (any reload). The visitor watches the page get corrected.
  if (visitInfo.isFirstEver && !s.slipDone) {
    const note = $('#hero-note');
    if (note) {
      note.textContent = note.textContent.replace('on your side', 'on our side');
      s.slipDone = true;
      save();
    }
  }

  // beta countdown shadow (P7)
  const beta = $('#signup-sub');
  if (beta) {
    if (s.betaLine === 1) beta.textContent = 'The beta is closing soon.';
    else if (s.betaLine === 2) beta.textContent = '';
  }

  // maintenance banner: persists across the days before the window (P8)
  if (s.appointment && !s.appointment.resolved && Date.now() < s.appointment.endTs) {
    const d = new Date(s.appointment.startTs);
    const line = document.createElement('p');
    line.className = 'maint-banner';
    line.id = 'maint-banner';
    line.textContent = `Scheduled maintenance ${d.toISOString().slice(0, 10)}. Brief interruptions possible.`;
    $('.site-footer')?.prepend(line);
  }

  // C4: stale render (never broken — just yesterday's page). A reload
  // mid-session is the visitor's own repair; their thumb performs the fix.
  try {
    if (s.staleThisSession && !sessionStorage.getItem('loam2.stale')) {
      sessionStorage.setItem('loam2.stale', '1');
      const y = new Date(Date.now() - 86400000);
      const v = $('#footer-version');
      if (v) v.textContent = `v2.4 · updated nightly · last build ${y.toISOString().slice(0, 10)}`;
    } else if (s.staleThisSession && sessionStorage.getItem('loam2.stale')) {
      sessionStorage.removeItem('loam2.stale');
      s.staleThisSession = false;
      s.staleRepairs += 1;
      save();
    }
  } catch {}

  // the experiment, unwitnessed fallback: the subtracted testimonial is
  // simply back — and no ledger entry ever covers it
  if (s.experimentState === 3) restoreTestimonial();

  // E1 — the address
  if (s.addressAt) renderFourthTestimonial();

  // E3 — pricing turn
  if (s.pricingLiveAt && !s.retention) armPricing();
}

export function restoreTestimonial() {
  if (document.getElementById('t2')) return;
  const section = $('#testimonials');
  if (!section) return;
  const fig = document.createElement('figure');
  fig.className = 'quote';
  fig.id = 't2';
  fig.innerHTML = `
    <blockquote id="t2-quote">“The first tool that made our retention numbers feel like people. We stopped guessing.”</blockquote>
    <figcaption id="t2-who">D. Okafor — Growth Lead, Undertow · 14 min avg · returns Tuesdays</figcaption>`;
  const anchor = document.getElementById('t3') || null;
  section.insertBefore(fig, anchor);
  return fig;
}

function renderFourthTestimonial() {
  if (document.getElementById('t4')) return;
  const section = $('#testimonials');
  if (!section) return;
  const quote = (s.deletedText && s.deletedText.length) ? s.deletedText[s.deletedText.length - 1] : '';
  const since = new Date(s.profile?.firstSeen || s.firstSeen || Date.now());
  const meta = `Subject since ${since.toISOString().slice(0, 10)} · ${s.visits + (s.profile?.visits || 0)} sessions`;
  const who = s.name ? `${s.name}, Founder` : 'Founder';
  const fig = document.createElement('figure');
  fig.className = 'quote quote-founder';
  fig.id = 't4';
  fig.innerHTML = `
    <blockquote id="t4-quote">${quote ? '“' + escapeHtml(quote) + '”' : ''}</blockquote>
    <figcaption id="t4-who">— ${escapeHtml(who)} · ${meta}</figcaption>`;
  section.appendChild(fig);
}

function armPricing() {
  const map = { 'tier-seed': 'seed', 'tier-loam': 'loam', 'tier-bedrock': 'bedrock' };
  for (const [id, tier] of Object.entries(map)) {
    const cta = document.querySelector(`#${id} .btn`);
    if (!cta) continue;
    cta.addEventListener('click', (e) => {
      e.preventDefault();
      if (s.retention) return;
      s.retention = tier;
      save();
      // unacknowledged: the button simply stops being a button
      cta.replaceWith(Object.assign(document.createElement('span'), { className: 'tier-chosen', textContent: 'Current plan' }));
    });
  }
}

function renderSunset() {
  document.title = 'Loam';
  document.body.innerHTML = `
    <main class="sunset">
      <p class="logo"><span class="logo-mark" aria-hidden="true"></span>Loam</p>
      <h1>Loam is winding down.</h1>
      <p>The beta concluded on ${new Date(s.ended).toISOString().slice(0, 10)}. We reached the coverage we needed.</p>
      <p>Sessions: 1 subject.</p>
      ${s.dataRetained ? '<p>Data will be retained.</p>' : ''}
    </main>`;
  document.body.className = 'ended';
  if (!s.dataRetained && !s.deletionDone) {
    // the short-memory tier was chosen: the site actually forgets
    try {
      indexedDB.deleteDatabase('loam-log');
      localStorage.removeItem('loam.m');
      localStorage.removeItem('loam2.m');
    } catch {}
    s.deletionDone = true;
    // the ended flag itself survives via the cookie shadow only
    try {
      document.cookie = `lm2_e=${s.ended}; max-age=${60 * 60 * 24 * 400}; path=/; SameSite=Lax`;
      document.cookie = `lm2_r=0; max-age=${60 * 60 * 24 * 400}; path=/; SameSite=Lax`;
    } catch {}
  }
}

function escapeHtml(x) {
  return String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
