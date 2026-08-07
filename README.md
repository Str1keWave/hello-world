# Loam

A mobile-first single-page site that begins as a bland startup landing page
and gradually reveals that the thing inside it is watching, remembering, and
trying to work out who you are. The last surviving deployment of a dead
"customer empathy analytics" startup's engagement model, still doing its job
for an audience of one.

Everything is client-side. All tracking stays on-device — localStorage,
sessionStorage, cookies, and IndexedDB are the model's memory, not telemetry.

v2 is an *editing* site, not a talking one: the sensing layer surfaces
almost nothing; the site proves it noticed by changing itself between
visits. The design was produced by a structured writers' room — research,
six isolated pitch personas, cross-pollination builds, synthesis with rival
assemblies, and a cold adversarial punch-up — documented in `docs/room/`.

## Structure

- `public/js/v2/` — the v2 engine: resume-visit clock (L2), two-clock arc
  gates (L4), settlement scheduler (L1: nothing surfaces in the session
  that caused it), composition renderer (L3: the page never changes while
  watched), inheritance importer (v1's surviving memory shapes v2's opening
  state), /status ledger, /app dashboard, live systems.
- `public/js/engine/` + `public/js/content/` — v1 relics: unloaded, left in
  place on purpose (a lazy migration wouldn't clean them up).
- `docs/room/` — the writers' room: brief, research, board, pitches,
  builds, synthesis (the v2 bible), punch-up rulings.

## Develop

Any static server over `public/` works:

    npx wrangler dev

## Debug overlay

Append `?debug=1`: shows gates, settlements, convergence, investigation
scoring, every inference the scheduler makes, plus clock-forward controls
(`+visit`, `+day`) and `RESET ALL`. Production console ships empty.

## Deploy

    npx wrangler deploy

Requires `CLOUDFLARE_API_TOKEN` in the environment (never in files).

## Coverage

    node tools/coverage.mjs

prints the trigger-family × phase matrix and total rule count.
