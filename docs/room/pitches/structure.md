# STRUCTURE PITCHES — arcs, clocks, frames, seeds

Lane: Q2, Q3, Q4. Two pitches break stated assumptions (flagged). No lines,
no dialogue — mechanisms and schedules only.

---

## 1. Exit-Timed Anomaly Loop

**Mechanism:** In early visits, the session's single permitted anomaly fires
only on `pagehide`/`visibilitychange` — the site edits one small element in
the instant the visitor leaves or switches tabs. The change cannot be
verified without returning. On return, the element is normal, the check
finds nothing, and the *next* exit plants the next one. Each episode ends on
its own cliffhanger; the verification impulse IS the return mechanism.

**Trigger:** First `pagehide` per session, visits 1–4 only; skipped entirely
on a randomized 1-in-3 of sessions.

**Feels like:** Leaving becomes the risky act. Doubt travels home with them.

**Why rare:** Uses the ≤1-anomaly budget, includes authored zero-sessions,
never speaks.

**Answers:** Q3.

---

## 2. Two Clocks, One Gate

**Mechanism:** Phase advancement requires BOTH thresholds: N distinct
visits AND M elapsed calendar days — the arc runs on whichever clock is
slower. A binger who makes ten visits in one night hits a wall: nothing
advances until a real day passes, and the engine treats same-day visits as
one continuing session for once-flags. A drifter who vanishes for two weeks
returns to changes sized to the absence (measured, not mentioned).

**Trigger:** Phase gate = min(visit_count, distinct_days) against per-phase
thresholds; absence-sized edits keyed to days-since-last-visit buckets.

**Feels like:** The site has its own schedule and cannot be rushed.

**Why rare:** Structural, zero surfaced content; it *removes* output from
binge paths.

**Answers:** Q3.

---

## 3. The Maintenance Window (BREAKS ASSUMPTION)

**Assumption broken:** The board states "return visits we cannot force."
We can force one — with an appointment.

**Mechanism:** Mid-arc, the status page (already in the footer) posts a
scheduled maintenance window: a real future date and hour, computed from
first-visit timestamp. Visiting DURING that window is the only time the
second frame's entrance is reachable. Miss it, and a once-flag closes that
route forever; the changelog later shows the work completed.

**Trigger:** Window renders at phase 2; entrance active only within the
real wall-clock interval; permanent flag either way.

**Feels like:** A calendar obligation to a static website. Missing it costs
something real.

**Why rare:** One window, once, unrepeatable by design.

**Answers:** Q3 (also feeds Q2).

---

## 4. The Dashboard Under the Door

**Mechanism:** First collapse: an unlinked, guessable path (`/app` or
`/login` — the copy already implies a product) serves Loam's actual
dashboard: one tracked site (this one), one subject profile (them),
populated live from the real memory channels — attention maps and
hesitation records of their own past visits. Second collapse: the
dashboard contains reviewer annotations timestamped BETWEEN the visitor's
visits — the sessions are being read by something with a work schedule.
Never linked, never announced.

**Trigger:** Path resolves only after phase 2; annotations accrue on
days-elapsed, not visits.

**Feels like:** Finding the back office. Then noticing someone's coffee is
still warm.

**Why rare:** Zero dialogue; discovery is entirely visitor-initiated
(broom-closet rule, P14: covered completely).

**Answers:** Q2.

---

## 5. Two Tabs, Two Roles (BREAKS ASSUMPTION)

**Assumption broken:** The board treats the audience-of-one as one role.
The site casts them as two — analyst and subject, simultaneously.

**Mechanism:** With the dashboard (pitch 4) open in tab A and the landing
page in tab B, BroadcastChannel streams tab B's live session into tab A's
subject view — scrolling the landing page moves the attention map in real
time. The product demonstrably works; its only user is its only subject.
The frame under "fake startup" is "functioning instrument."

**Trigger:** Two same-origin tabs, dashboard unlocked; behaves exactly as
the product copy describes, no commentary.

**Feels like:** Operating the surveillance tool on yourself, live.

**Why rare:** Requires deliberate two-tab investigation; no text budget
spent.

**Answers:** Q2 (uses Q5 mechanically: they built the watcher's watcher).

---

## 6. The Company Dies on Your Clock

**Mechanism:** The subpages (about, blog, careers, status) form a decaying
layer. Careers postings close one by one; the blog's cadence stops; uptime
figures slip; a team page loses a member. Every date is computed from
first-visit timestamp, so binger and drifter each see a coherent wind-down
synchronized to their own arc. Under "startup landing page" is "company
that ended"; under that: the pages are still being edited *after* the
ending — by what remains.

**Trigger:** Content states keyed to days-since-first-visit; final state
locks with a once-flag.

**Feels like:** Reading a place's last months out of order, then realizing
the lights are on.

**Why rare:** All edits are between-visit and unacknowledged.

**Answers:** Q2 (also Q3: decay gives drifters a reason returns matter).

---

## 7. Pricing Is the Ending's Instrument

**Mechanism:** Seed now: the tiers already describe memory retention
("7-day memory," "Unlimited visitor memory"). Keep every tier's copy
literally true of the site's own memory behavior toward the visitor. The
final beat re-renders the existing pricing table as a genuine choice: the
visitor selects which retention tier the site applies to THEM — once-
flagged, irreversible, with short memory meaning real deletion across all
channels. No new page; the ordinary table becomes the ending's control
panel.

**Trigger:** Final phase repurposes existing tier CTAs; choice writes
permanent state; endings diverge by tier.

**Feels like:** A pricing page skimmed on day one is suddenly about them,
and clicking costs something.

**Why rare:** Recontextualization by reuse; zero dialogue budget.

**Answers:** Q4 (complicity per P16: they choose).

---

## 8. The Fourth Testimonial Slot

**Mechanism:** Seed now: each testimonial carries small structured
metadata — a duration, a visit count, a time-of-day habit — formatted
consistently and reading as ordinary copy. At the ending, a fourth figure
appears in the same format, its metadata drawn from the visitor's actual
recorded trajectory (name only if they typed one into the form; otherwise
the attribution stays structurally incomplete). The first three re-read
instantly as prior subjects; the section was a roster all along.

**Trigger:** Ending phase inserts the slot once; afterward the section
reverts to three, permanently.

**Feels like:** Recognizing your own file in a cabinet you walked past
daily.

**Why rare:** This IS the one direct-address expenditure, spent as an edit
rather than speech.

**Answers:** Q4 (also Q1: the site collects completed subjects).
