# RULE AUTHORING FORMAT

Content lives in `public/js/content/*.js`. Each file default-exports an array
of rule objects. The engine (`public/js/engine/`) is off-limits to content
authors — if you need a capability it doesn't have, leave a `// TODO(engine)`
comment instead of touching engine code.

## A rule

```js
{
  id: 'touch.rage.button.1',   // REQUIRED. unique. prefix with your family.
  on: 'tap.rage',              // REQUIRED. event type, or array of types.
  phase: [2, 3],               // inclusive [min,max]. omit = any phase.
  priority: 50,                // higher wins when several rules match. default 10.
                               // 0–19 generic fallback, 20–59 specific,
                               // 60–89 very specific, 90+ story-critical.
  once: true,                  // fire at most once ever (persisted across visits)
  maxFires: 3,                 // cap total fires (persisted). once === maxFires:1
  cooldown: 45,                // seconds before this rule may fire again
  chance: 0.5,                 // probability gate after all other checks
  when: (s, ev) => true,       // optional predicate. s = state, ev = {type, data, t}
  say: "line",                 // dialogue. string | array | {pick: [...]}
                               //   array   -> fire #1 gets [0], #2 gets [1], … clamps to last
                               //   {pick}  -> uniform random variant
  mood: 'curious',             // calm | curious | wary | ruffled | tender | flat
  silent: true,                // deliberate silence: no output, but the fire is
                               //   counted + logged. Give a `note`.
  effect: (ctx, ev) => {},     // imperative extras. runs after `say`.
  note: 'authoring intent',    // optional, for humans
}
```

Matching: for each event the resolver collects rules where `on` matches, phase
gate passes, once/maxFires/cooldown pass, `when` passes, `chance` passes —
then fires ONLY the highest-priority one (ties: random). Everything else about
the event is still counted in state, always.

## Global speech rationing (the engine enforces this — trust it)

The voice speaks at most once per ~8s; lower-priority lines queue briefly or
drop. Phase 0 `say` is hard-dropped (logged as chosen silence) — in Phase 0
only `drift` and `silent` rules make sense. Don't fight the rationing with
high priorities; reserve 90+ for story beats.

## `state` (read-only in `when`)

- `s.phase` 0–4, `s.visits`, `s.firstSeen`, `s.lastSeen`, `s.gapMs` (since prev visit)
- `s.name` (string|null), `s.ending` (null|'cruel'|'kind'|'indifferent'|'completionist')
- `s.counters` — per event type, e.g. `s.counters['tap.rage']` (this visit)
- `s.totals` — same but lifetime
- `s.disposition` — {kindness, cruelty, patience, curiosity, defiance} numbers
- `s.flags` — shared scratch space, e.g. `s.flags.sawDashboard`
- `s.reloads`, `s.refusals` (array of permission denials), `s.deletedText` (last few)

## `ctx` (inside `effect`)

- `ctx.say(text, {mood, priority})` — same pipeline as `say`
- `ctx.drift(selector, text)` — mutate page copy quietly (Phase 0/1 weapon)
- `ctx.title(text)` / `ctx.titleWhenHidden(text)` — tab title channel
- `ctx.favicon(emotion)` — 'neutral'|'awake'|'upset' favicon swap
- `ctx.setFlag(key, value)`, `ctx.inc(key)` — persisted custom state
- `ctx.disposition({kindness: +1})` — nudge the personality read
- `ctx.advancePhase(n)` — never skip ahead more than current+1
- `ctx.clipboard(text)` — write to clipboard (only valid inside a user-gesture event)
- `ctx.recentEvents(n)` / `ctx.queryLog(type, limit)` — IndexedDB receipts (async)
- `ctx.selectionColor(css)` — ::selection color (upset = rust)
- `ctx.state` — the live state (mutate only flags/custom keys)

## Template tokens in `say` strings

`{name}` (falls back to nothing — write lines that survive its absence, or gate
on `s.name`), `{visits}`, `{count}` (count of the triggering event type this
visit), `{total}` (lifetime), `{hour}` (0–23 local), `{gap}` (humanized time
since last visit, e.g. "two weeks").

## The ten commandments

1. Every event type in your family must resolve to something in every phase —
   a specific rule, a generic fallback (priority < 20), or a `silent` rule.
2. Cooldowns are not optional. A rule without `once`/`maxFires`/`cooldown` is
   a bug unless it's a low-priority fallback with `chance` < 0.3.
3. Mention the specifics: counts, section names, elapsed time. That's the act.
4. Never the same joke twice. Read your file before finishing.
5. Phase 0 does not speak. Phase 1 does not say "I".
6. Escalation sequences use `say: [first, second, third]` on one rule, not
   three rules.
7. Read `docs/VOICE.md` before and after writing. Delete your worst 10%.
8. Dispositions: cruelty (rage, mockery, deleting), kindness (answering,
   patience, coming back), curiosity (digging, devtools, 404s), patience
   (reading, idling politely), defiance (refusals, back button, adblock-y
   behavior). Nudge them where behavior earns it — endings depend on these.
9. IDs are stable forever (they're persisted in `firedRules`). Don't rename.
10. `note` on anything non-obvious. The QA pass reads them.
