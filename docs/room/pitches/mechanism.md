# MECHANISM PITCHES

Behaviors only. No authored words to the visitor in any of these.

---

## 1. Edits Only in Blind Spots

**Mechanism:** IntersectionObserver dwell map (per section, per visit) persists to memory. The edit scheduler applies structural changes (remove a list item, swap two cards, alter a number) ONLY to sections whose lifetime dwell is zero or near-zero. Anything the visitor has actually read is never touched.
**Trigger:** Visit N ≥ 2; a section exists with dwell below threshold; one edit per visit max, drawn from that set.
**Feels like:** Every check of a remembered section confirms it is unchanged — yet the page is somehow not the same. The change is always where they weren't.
**Why rare:** One structural edit per visit, and zero on visits where all sections were read. Inverts the research's own example (the lingered testimonial vanishing), which the author will predict.
**Answers:** Q3 — the unfindable edit is the return hook.

## 2. Work Happens Only While Hidden

**Mechanism:** All scheduled DOM edits queue and flush exclusively while `document.visibilityState === 'hidden'`. On return to visible, `scrollY` is additionally offset by 40–80px from where they left it. A visitor who never backgrounds the tab sees a site that never changes.
**Trigger:** Any pending edit + a hidden interval ≥ 10s. Scroll offset: once per session, cooldown across sessions.
**Feels like:** The page holds still under observation. Coming back to the tab, they are standing in a slightly different place on it.
**Why rare:** This is a delivery rule, not new content — it spends no budget. It converts already-budgeted edits into unobservable ones.
**Answers:** Q1 partially — the site behaves as if being seen mid-edit is the thing it avoids.

## 3. Second Tab Gets the Clean Page

**Mechanism:** BroadcastChannel plus a `sessionStorage` tab ID. When a second concurrent tab opens, the new tab renders the pristine visit-1 DOM — no edits, no memory-driven state — while the original tab keeps the current edited state. Close the old tab and reload the new one: current state returns.
**Trigger:** Two live tabs of the site, arc phase ≥ middle, no once-flag (repeatable, because it is checkable and consistent).
**Feels like:** Side by side, the site is two different sites. The clean version still exists and is being shown to someone — just not to them.
**Why rare:** Costs nothing until the visitor opens two tabs, which they will do exactly to test it (P14: covered completely).
**Answers:** Q2 — the clean page is demonstrated to be a costume that can be re-worn.

## 4. Back Button Serves Yesterday

**Mechanism:** After each edit batch, the pre-edit DOM snapshot is serialized to IndexedDB and a `history.pushState` entry is added. One back-press re-renders the previous snapshot in full. Any interaction inside it, or a second back-press, discards it permanently and deletes the snapshot.
**Trigger:** First back-press after the visitor has revisited a changed section (dwell map shows re-inspection). Lifetime once-flag.
**Feels like:** The version they remembered is real, reachable through their own repair reflex — then never again.
**Why rare:** BREAKS the board's assumption that the visitor must never be able to confirm a change ("leaves with nothing they could screenshot"). One confirmed instance, self-destructing, converts permanent doubt into one unrepeatable certainty — which is worse.
**Answers:** Q3, and Q5 — the author expects deniability policy, not a single proof.

## 5. Deleted Text Returns as Placeholder

**Mechanism:** The input sensor already sees typing. Characters typed then deleted in the signup name field are stored verbatim in memory. On a later visit, that field's `placeholder` attribute is replaced with the visitor's own deleted string. Submitting or focusing the field reverts it permanently.
**Trigger:** ≥3 characters typed and fully deleted in a prior session; surfaces on visit ≥ 3; lifetime once-flag.
**Feels like:** The page kept the thing they almost said. The "Hesitation signals" feature card was documentation.
**Why rare:** Text appears, but zero authored words — the visitor wrote it. Names the brief's implicit assumption that all text-to-visitor is dialogue; this is playback, and it spends no dialogue budget (showrunner may rule otherwise).
**Answers:** Q4 — seeds the feature cards for re-reading.

## 6. Wipe Restores Everything but Scroll

**Mechanism:** Memory is redundant across localStorage, cookie, IndexedDB. If localStorage is found empty while a sibling channel survives, the site renders the pristine visit-1 page, all flags apparently reset — except it restores the visitor's exact pre-wipe `scrollY` on load, once. Nothing else acknowledges the wipe, ever. Once-flags silently persist via the surviving channel.
**Trigger:** Detected storage clear. The scroll restore fires on the first post-wipe load only.
**Feels like:** The reset worked, according to everything checkable — except the page opened where they last were.
**Why rare:** One tell, one frame, unrepeatable. Full coverage of a disbelief action (P14) using P11's reserved response, spent as behavior instead of speech.
**Answers:** Q5 — the author will absolutely wipe storage to audit the reset.

## 7. Favicon Off-Center While Unfocused

**Mechanism:** The favicon is an inline SVG data URI: dot centered in a rounded square. While the tab is hidden, the `link[rel=icon]` href is swapped for a variant with the dot displaced 3px toward one corner. On `visibilitychange` to visible, it is restored before paint. It is only ever visible peripherally, from another tab.
**Trigger:** Hidden intervals ≥ 30s, arc phase ≥ middle, max once per session.
**Feels like:** Something in the tab strip is wrong until looked at directly.
**Why rare:** BREAKS the board's "boundary crossings: 1" budget — by arguing a sub-proof, never-directly-observable chrome change is deniable-class, not crossing-class, and should be exempt. If the room disagrees, this IS the one crossing.
**Answers:** Q1 — again, observation stops it.

## 8. The Watched Section Freezes

**Mechanism:** The engine detects a verification ritual: the same section scrolled to within the first seconds of load on ≥3 consecutive visits (first-scroll-target consistency from the scroll sensor). That section is then flagged immutable — excluded from every edit pool permanently — while edit frequency elsewhere is unchanged.
**Trigger:** Three consecutive visits with matching first-inspection target. Silent, permanent, per-section.
**Feels like:** Whatever they choose to monitor becomes the one fixed point. The site refuses to perform where the camera points, and they can only discover this by noticing their control sample is the only stable thing.
**Why rare:** It generates no events at all — it is a subtraction. Rarity budget: negative.
**Answers:** Q5 — a mechanic that only means something to a visitor who audits, i.e., the author.
