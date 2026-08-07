# BUILD CONTRACT — module interfaces (binding for all builders)

All ES modules under public/js/. No third-party deps. transform/opacity/
canvas only; no layout thrash after boot. All numbers tunable via T in
tunables.js. Shared singletons imported directly (no DI).

## Layering (index.html, built by the RENDER builder)

- body: position:fixed inset:0, 100dvh, touch-action:none, user-select:none,
  -webkit-touch-callout:none, overscroll-behavior:none.
- #skin  — canvas z0, full viewport (the paper itself; all body color lives here)
- #page  — DOM stage z1, pointer-events:none on text (touch handled globally)
- #aura  — canvas z2, pointer-events:none (wavefront rings, pseudopod, subsong shimmer)
- #loose — div z3 (floating word spans, glyph, shards; DOM, absolutely positioned)
- #debug — z9, only under ?debug=1

## events.js (I write it; 20 lines; everyone imports { on, emit })

emit(type, data) synchronous fan-out; on(type, fn) subscribe. Event names
and payloads (exhaustive; do not invent others):

From touch.js (dynamics builder):
- 'touch.down' {x,y,id}    'touch.move' {x,y,dx,dy,v,id}   'touch.up' {x,y,id}
- 'gesture.tap' {x,y}      'gesture.hardtap' {x,y}
- 'gesture.flick' {x,y,vx,vy}                (fast release velocity)
- 'gesture.stroke' {path:[{x,y}...], dir, len, speed}  (slow drag, emitted on end)
- 'gesture.strokeMove' {x,y,dx,dy}           (throttled, during slow drags)
- 'gesture.hold' {x,y}                       (~2s still, ≤12px wander, once per hold)
- 'gesture.holdEnd' {x,y,ms}
- 'motif.tap' {pattern:[ms,...], count}      (a repeated tap-rhythm became a motif)
- 'motif.stroke' {shape:[{x,y}...normalized], count}
  (noise floor: grazes under T.noise travel/duration emit NOTHING; palm-size
   or multi-point contacts emit NOTHING)

From nerves.js (dynamics builder):
- 'nerves.startle' {level}    'nerves.calm' {}     'nerves.state' {arousal,trust,tension} (throttled ~4Hz)

From play.js (dynamics builder):
- 'play.swap' {}              (possession-swap completed)
- 'play.chase' {}             'play.wrongGuess' {}  'play.offerIgnored' {n}
- 'play.collision' {gx,gy}    (flung mote trajectory hit the carried gift — ONLY the arc decides what that means)

From language.js (mine):
- 'word.ratified' {wordId}    'word.spent' {wordId, revocable}
- 'word.repossessed' {wordId} 'speech.done' {utteranceId}

From arc.js (mine):
- 'arc.movement' {n}          'arc.rest' {n}      'arc.break' {}   'arc.repaired' {}
- 'arc.ended' {}

## skin.js (RENDER builder) — exports:

- initSkin(canvasSkin, canvasAura) — sizes to devicePixelRatio, starts rAF loop.
- skin.setBreath(rate, depth)      — rate Hz-ish, depth 0..1
- skin.setArousal(a)               — 0..1; drives passing-cloud frequency/tint
- skin.excite(x,y,amount)          — local excitation bloom (diffuses, decays)
- skin.clench(level)               — startle posture: whole-page tighten (scale .995, desaturate), fast breath; level 0..1; decays via skin.setClenchDecay(ms)
- skin.ringAt(x,y,strength)        — wavefront ring on aura canvas AROUND point (never under): radius starts 48px
- skin.leanTo(x,y,amount)          — papillae lean: local field deformation toward point
- skin.pseudopod(x1,y1,x2,y2,progress) — draw attention tendril on aura from body locus toward target; progress 0..1; call each frame while active
- skin.subsong(x,y,glyphish)       — faint almost-letter shimmer near point (rehearsal)
- skin.locus()                     — {x,y} current body-mass center (drifts; moved by:)
- skin.moveLocus(x,y,urgency)      — steer body-mass (with organic overshoot)
- skin.flickerStruggle(on)         — the Break's half-failed re-camouflage: rhythmic organic posture flicker (600ms cycles, easing, NEVER jitter/tear)
- skin.setReducedMotion(bool)      — bioluminescence dialect: opacity/color only
- Reads nothing from other modules. Pure output organ.

## stage.js (RENDER builder) — exports:

- buildStage(pageEl) — renders the Port Sorrel page (copy below, verbatim), wraps
  EVERY word in <span class="w" data-w="ID">; returns wordMap {id → el}.
- wordRect(id) → DOMRect. gapOpen(id, {revocable}) — replace word with gap
  element preserving width; tooth-mark = .gap::after notch; revocable gaps
  styled paler. gapClose(id) — heal (revocable era only).
- dodgeNear(x,y) — words within 90px flow away from point (transform, spring
  back over ~1.2s). Used for first-contact and repeatable at low amplitude.
- trembleWord(id,on) — tiny tremor while under attention.
- noSpotRect() → DOMRect of the notice box; stage.js also implements its
  DODGE (recoil translate away from approaching finger; listens to
  'gesture.strokeMove'/'touch.move' proximity itself).
- STAGE COPY (verbatim; the word IDs in CAPS are load-bearing):
  Header h1: "PORT SORREL — TIDE TABLES"            [PORT] [SORREL]
  Sub: "Official predictions and observations, Port Sorrel harbour."
  Nav: "Home"                                        [HOME]
  Table: columns "Day / PREDICTED / OBSERVED / Height"   [PREDICTED] [OBSERVED]
    7 rows, e.g. "Mon · high water 04:12 · high water 04:19 · 4.1 m"
    (rows include the strings "high water" [HIGHWATER], "low water" [LOWWATER],
     "first light 05:41" [FIRSTLIGHT] on one row)
  Conditions line: "Conditions: slack at 14:20. Sea still."    [SLACK] [STILL]
  Notice box (the no-spot): "Harbour office hours 9–4. Office hours also
    apply on public holidays."                       [HOURS] [ALSO]
  Last updated line: "Last updated — see notice."
  Footer: "© Port Sorrel Harbour Authority. All rights reserved.
    Thank you for visiting."                         [RESERVED] [THANK] [YOU]
  PRE-EXISTING GAP: one letterform is already missing at load — the "l" of
  "visiting" ("visiting" renders "visi ing" with a tooth-marked gap): that
  stray letter IS the creature's toy glyph, already loose on the page.
- CSS: honest municipal (system-ui, one #1a5276 blue, table borders); the
  page must fit 390×844 entirely, no scroll anywhere; visually complete.

## touch.js / nerves.js / play.js (DYNAMICS builder)

touch.js: mountTouch() — pointer listeners on window implementing the
gesture grammar + noise floor + motif bank (see events). Motifs: tap rhythm
= 2+ repetitions of the same quantized interval pattern (2-5 taps); stroke
motif = 2+ repetitions of similar normalized shape (resample 16 pts,
tolerance loose). Expose motifBank() → {taps:[...], strokes:[...], first}
(first = earliest motif of either kind).

nerves.js: mountNerves() — state {arousal, trust, tension}; listens to
gestures: flick/hardtap raise tension → over threshold: emit nerves.startle
+ skin.clench; habituation: every startle raises threshold permanently a
step (any style of contact counts — see DESIGN rulings P3); trust rises
with any sustained interaction, faster with strokes/holds; drives skin
breath/arousal continuously; sensitize(mult) export for the arc (Break).
Exposes nerves.state().

play.js: mountPlay(gl) — the toy glyph physics (spring/friction, position
via transform on the #loose element created by stage's pre-existing gap),
possession tracking (last mover), creature chase via skin.moveLocus with
overshoot + nudges, wrong-guess predictor (track habitual fling targets;
overcommit; slink = locus retreat + excite fade), offer behavior (pushes
toy to thumb; count ignores), carried-gift mode: carryGift(el) tethers a
second glyph to touch with soft spring; collision detection (fling
trajectory × gift position → emit play.collision). setPlayEnabled(bool),
setBaitCap(2). Shatter/shards are the ARC's job (mine) — play.js only
reports the collision.

## persist.js (mine), language.js (mine), arc.js (mine), main.js (mine),
## tunables.js (mine — all magic numbers; builders reference T.* where noted)

## Build rules

- Only touch your own files. node --check clean. No console output at all
  (debug gated). Respect prefers-reduced-motion via skin.setReducedMotion.
- Municipal page must look REAL. All motion organic: eased, springy, never
  linear, never instant except the startle snap.
