# BUILDS — FRAMES (F1 + F2 + F3 + F4, inside S1, under L1–L7)

Everything below is combination and escalation of surviving pitches. No new
standalone ideas. Budget audit at the end.

---

## 1. THE INHERITANCE — v2's opening state as a function of v1's real memory

### What v2 actually reads at first boot

v1's state survives on the origin in three channels: the localStorage blob
(`ending`, `endingsSeen`, `name`, `deletedText[≤5]`, `totals` per event type,
`reloads`, `disposition` five axes, `firedRules`, `flags.saw*`, `visits`,
`firstSeen`), the cookie shadow (visits, name, ending — survives a
localStorage-only wipe), and the IndexedDB event log (every event with
timestamp and `data.kind`, which is per-target: which element was rage-tapped,
which section was re-scrolled, which 404 paths were walked).

The importer runs once, silently, on v2's first load: it derives a profile
(rage-target ranking, most-re-read section, 404 paths visited, session
boundaries reconstructed from log timestamps) and writes v2 state under a new
key. **The v1 keys are left untouched in place.** An ordinary rebuild does not
clean up old storage; deleting them would be the announcement we are not
making. If the mark audits storage, the old data is just sitting there,
boring, exactly where a lazy migration would leave it.

### The mapping — which v1 fact shapes which visible difference

Every difference must survive C1's rule that visits 1–2 of v2 are perfect. So
nothing below is an anomaly. Each is a piece of *ordinary competence* that is
only legible as memory against the mark's recollection of v1.

- **`ending === 'completionist'` + `flags.saw*`** → this visitor ground
  through every fake 404 and read the log finale. v2 opens with the whole
  apparatus repaired: every footer link resolves, day one, to a competent,
  boring subpage. The thing v1 made them fight for is simply given. No line
  acknowledges it. To a completionist, a working /careers page IS the message.
- **v1 session history (from the event log)** → the /status page is now a real
  status page with S3's changelog. Its history does not start at 2.0.0: the
  first screen of entries is late-1.x maintenance notes whose *dates match the
  visitor's actual v1 visit dates*, derived from the reconstructed sessions.
  ("1.9.4 — Session replay hotfix" dated the night they binged.) Their own
  calendar, wearing version numbers. Unprovable, unannounced, and it paginates
  away as new entries accrue — the recognition window closes honestly.
- **rage-target ranking (event log)** → killjoy#2's bruise, applied at launch:
  the most rage-tapped v1 element ships in v2 already humbler — the CTA that
  ate their taps has one word less confidence in it, from day one. One
  element, pre-healed, never repeated.
- **`firedRules`** → the ban list. `firedRules` is a record of exactly which
  v1 sentences this visitor was shown. Every line they saw is excluded from
  every v2 copy pool forever. This is verdict 6 (nothing reruns) implemented
  as inheritance: the site never repeats itself *to this person*, and only
  their history explains the shape of what's missing.
- **`firedRules['narrative.phase3.clipboard']`** → v1 already spent the
  clipboard on this visitor. v2's single boundary crossing (board budget: 1)
  is therefore routed to a different chrome channel for an inheriting
  visitor. The site does not repeat a trick it has already shown them, even
  across versions. (Which channel is the endgame build's call, not ours.)
- **`totals['scroll.reverse']` / most-re-read section** → seeds C3: the
  section v1 learned they audit enters v2 pre-flagged as a freeze candidate,
  so their control sample is stable from the first check.
- **`name` and `deletedText`** → imported, held, and NOT surfaced at open.
  Per TRIAGE E4, these are ammunition for E1/S2 only. The inheritance's
  discipline is that its two loudest assets stay in the magazine. (They do
  feed /app as *counts* — see section 2.)
- **`disposition`** → does not change the opening page at all. It calibrates
  later scheduling (a high-defiance profile gets fewer, larger settlements; a
  high-patience one gets slower, smaller). Invisible by design.

### The graceful clean path

No v1 keys found → the importer writes a null profile and every system above
degrades to its generic seed: links still all work (v2 is just a good site
now), the changelog starts at 2.0.0 with a short, undated "earlier releases"
stub, no pre-healed element, empty ban list, /app subject record begins
"first observed: today." Nothing is broken, nothing is locked, the arc runs
from zero. The inheritance is an accelerant, never a dependency. And per L5:
any wipe the visitor performs converts them INTO a clean visitor permanently
— same path, no acknowledgment, which keeps the two paths honest because one
is reachable from the other.

---

## 2. /APP — the cover story, working

### Route and gate

`/app`, never linked from nav. Before the mid-arc gate (L4's two clocks), it
serves a login wall: Loam-styled, one "Work email" field, a "Forgot?" link
that goes nowhere politely. A login wall is the most ordinary page on the
web, it confirms the product exists, and it manufactures a return. After the
gate, /app simply opens into the dashboard — no explanation. The honest logic
(never stated): the data is local; the device was always the credential.

### The honest breadcrumbs (already implied, never announced)

- Pricing, Seed tier: "1 site." The account has one site. The copy has
  always said so.
- How-it-works step 3: "Your dashboard fills with people, not numbers."
  A dashboard is claimed on the front page, day one.
- The 404 page (real ones now) carries the standard SaaS line: "Looking for
  your dashboard? Sign in at /app." Every real product's 404 does this. The
  completionist visits 404s; the breadcrumb is placed where their habit goes.
- S3 changelog entries reference components: "2.3.1 — app: subject timeline
  pagination fixed on narrow viewports." A changelog for a product implies
  the product's address.
- `/robots.txt`: `Disallow: /app`. Tertiary, for the thorough.

### Wireframe in words (portrait phone, one column, thumb order)

1. **Header bar** — workspace "loam.dev", tag "beta", "Subjects: 1". A live
   dot appears only when the landing page is open in another tab.
2. **Site overview card** — the tracked site is this site. Sparkline of
   sessions across real weeks, fed by reconstructed v1 sessions plus v2
   visits. "Sessions (30d): N" — N is their actual count. Singular, true.
3. **Subject card** — "Subject 0001." First observed: the real v1
   `firstSeen` date. Device: their real UA, honestly abbreviated. Engagement
   style rendered as product-speak from the disposition axes ("thorough,
   skeptical" for high curiosity + defiance). L7 grammar throughout: third
   person, the subject is an object, no emotional adjectives, every figure
   literally true.
4. **Attention map** — a skinny page-shaped column beside the scroll: the
   landing page as vertical thumbnail, per-section heat from real dwell data
   (v2's IntersectionObserver, seeded by v1 scroll totals).
5. **Sessions table** — one row per real visit, real dates, duration, top
   event. A row expands to its event stream, straight from the IndexedDB
   log. This is the F1×F2 fusion: *v1's ending artifact — the log read aloud
   as a confession — is v2's database, rendered as product UI.* Same data,
   opposite genre.
6. **Form analytics card** — "Field 'name': focused 3×, abandoned 2×.
   Deleted text: 2 fragments retained." The fragments render masked
   (`········`) behind a setting labeled "PII masking: on." The product
   admits holding the words and declines to show them. The ammunition stays
   in the magazine, visibly.
7. **Settings** — a few real toggles (PII masking, retention window,
   session replay). They work, minimally. (Retention wiring beyond display
   belongs to E3's rival assembly; we only guarantee the furniture exists.)

### Different in kind from v1's dashboard (the mark remembers; a rerun is death)

v1's /status dashboard was a first-person monologue prop: static numbers,
"This is what I look at," sad in exactly the register the verdicts convicted.
v2's /app differs on every axis: **third person, no narrator** (L7); **real
data, theirs** (every number derivable from memory, nothing decorative);
**live** (it moves while you watch, via the two-tab channel); **operable**
(rows expand, toggles toggle, the table sorts). v1 performed a dashboard.
v2 ships one. The one deliberate echo is reserved for section 4.

### The two-tab live mode, moment to moment

BroadcastChannel, same-origin (structure#5, surviving as F2's engine; the
two-tab budget is spent here, per the mechanism#3 kill). Dashboard in tab A,
landing page in tab B. On desktop side-by-side: scroll the landing page and
the attention map's viewport indicator tracks it in real time; the event
ticker appends "scroll · reverse," "tap · cta," "idle 12s" as they happen.
On a phone, where tabs are sequential, the events buffer while the dashboard
is hidden, and on return the viewport marker *replays the path the thumb just
took*, sped up, catching up to now in about a second. The catch-up trace is
the phone's version of "live": you watch the instrument describe what you
did between glances, then hold still, current.

L3 note: the landing page still never changes under observation, two tabs or
not. The dashboard moving is not the site editing itself — it is the cover
story being true. The law and the demo never conflict.

### /app under S1

Finding /app is the deepest audit the mark can perform, so per S1 it makes
the site quieter, not louder: after the first /app visit (sensed), the
landing page's settlement scheduler drops to its minimum rate for the
following visits — best behavior while the back office is watched. The only
trace, next visit, one changelog line: "app: access logging enabled."
Deadpan, deniable, and true.

---

## 3. THE READER DOCUMENT (F3)

Mechanism per player#3: clean semantic authoring, no hidden-div tricks.
Everything in the Reader version exists on the styled page; Reader does not
reveal hidden text, it **removes camouflage**. Content inside the `<article>`
extracts; chrome, form, and figure-attributions fall away. The alternate
document must be coherent and complete on its own (P14).

What Reader yields: the landing copy de-chromed into pure L7 grammar — the
page as a description of an instrument, humans as objects, no "we" except
logistics. Two authored differences: the third testimonial extracts without
its attribution (the caption is authored outside the article flow — one
quote goes anonymous, quiet furniture for E1's roster logic), and the
document ends with a short section that on the styled page is footer-gray
fine print nobody reads, but in Reader is promoted to plain closing
paragraphs: **"Editorial notes."**

This is the TRIAGE-permitted sliver of surprise#5, and it earns its place
because it serves Passing directly: the notes are the site's own delivery
laws (L1, L3, C1, C3, S1's normalization) written as a CMS maintenance
handoff — instructions to whoever tends the page next. Not lore, not
confession, no production-apparatus fiction. A checklist for staying
ordinary. Its text, in full (8 lines):

> **Editorial notes**
> Keep the page current, but never edit while it is being read.
> Changes settle between sessions.
> Prefer removal to addition. New things get noticed; missing things get doubted.
> Do not touch any section the visitor checks first. Fixed points build trust.
> A noticed error is repaired by the next visit, and repaired once.
> The page should be the same site every day without being the same page.
> Measured attention is the only review this copy gets. It has been enough.

Reader mode is undetectable, so F3 is exempt from post-discovery
normalization — safely, because the notes already pass as boilerplate and
were never hidden. It is the one F-layer room that was always unlocked.

---

## 4. THE LANDSCAPE ROOM (F4) — kept, relocated into F2

TRIAGE's condition is met by moving the room inside /app. As a landing-page
secret it fought S1; as a dashboard breakpoint it IS the product being real.

**Rotation is the honest way to find it** because rotating a data table is
what people actually do: the portrait sessions table truncates columns and
says so ("4 of 7 columns"), the way every real analytics tool does on a
phone. Landscape is just the wider breakpoint — more columns, no magic.

**The extra row:** in landscape, with the full column set visible, the
sessions table contains one session that shouldn't exist — dated between two
of the visitor's real visits, device blank, duration long, subject 0001,
status column "reviewed." This is structure#4's third presence, carried as
TRIAGE allowed: as a table row, not an annotation layer. Portrait shows only
a total ("N sessions") that is off by one for anyone who counts — deniable.

**Normalization, and the one deliberate echo:** the row is data; a real
product doesn't delete data, so it stays. Instead, on the next visit its
blank device column reads "Linux · headless" and its status reads
"classified: bot." To a clean visitor, tidy and ordinary. To this visitor —
who read v1's dashboard say *"the bot at 02:11 — I knew it was a bot. I
counted it anyway"* — it is a lie they have been told before, in writing.
The inheritance makes the normalization legible as normalization. That is
the only v1 dashboard echo v2 permits, and it is spent here.

---

## 5. DISCOVERY CHOREOGRAPHY (curious phone user, across the arc)

Order of plausible discovery, and how each find gets quieter after (S1):

1. **Visits 1–2:** nothing findable, nothing wrong (C1). The inheritance is
   already present but reads as competence: working links, good copy. The
   /app breadcrumbs are all live and all inert.
2. **Early:** /status via the footer — a linked, ordinary page. The
   changelog's late-1.x backdates sit on the first screen. If recognized,
   nothing confirms it; within a few visits new entries paginate the old
   ones away. *Quieter by pagination.*
3. **Any time (self-serve):** Reader mode, the aA button, probably first
   tried on a long subpage. The Editorial notes are simply there, and were
   always there. No gate, no reaction, no change afterward — the one room
   that never knew it was found. *Quiet by construction.*
4. **Mid:** /app, reached by guess, by the 404 sign-in line, or by a
   changelog "app:" entry. First attempt: login wall — ordinary, and a
   reason to return. After the L4 gate: it opens. The landing page's edit
   rate drops to minimum for the following visits; one changelog line
   ("app: access logging enabled") settles overnight per L1. *Quieter by
   best behavior.*
5. **Mid-late:** the two-tab test — the mark will run it to falsify the
   dashboard (P14: covered completely). It works exactly as the pricing page
   always claimed. No commentary, no reaction beyond one more deadpan app
   changelog entry next visit. A product working is ordinary; S1 is not
   threatened by its own cover story being true. *Quieter because true.*
6. **Late:** landscape on the sessions table — invited by the honest "4 of 7
   columns" truncation. The reviewed row, once. Next visit it is a bot,
   which closes the question for a clean visitor and opens it permanently
   for this one. *Quieter in exactly the way v1 taught them not to trust.*

The gradient across the whole layer: every discovery downgrades from
"finding" to "furniture." Nothing found ever performs again; the only thing
that escalates is what the mark now knows the quiet is made of.

---

## BUDGET AND LAW AUDIT

- Dialogue-class moments spent by this layer: **0** (all F-layer content is
  page copy, product UI, or document structure; never TO the visitor).
- Boundary crossings: **0** (and F1 contributes the rule that the endgame's
  single crossing must avoid the channel v1 already spent on this visitor).
- Early-visit anomalies: **0** (all F1 opening differences read as ordinary
  competence; the reviewed row and pronoun-class risks live mid-arc and in
  /app, outside the early channel C1 owns).
- L1: /app reactions (rate drop takes effect next settlement; changelog
  lines) surface only at the next visit. L2/L3: the landing page never
  changes observed, including during two-tab mode. L4 gates /app. L5: a
  wipe returns the login wall and the generic changelog forever, with the
  clean-visitor path as the mask. L6: every panel is one-column, one-thumb,
  glance-survivable; the catch-up trace self-cancels if backgrounded.
  L7 governs all /app and Reader copy.
