# Loam

A mobile-first single-page site that begins as a bland startup landing page
and gradually reveals that the thing inside it is watching, remembering, and
trying to work out who you are. The last surviving deployment of a dead
"customer empathy analytics" startup's engagement model, still doing its job
for an audience of one.

Everything is client-side. All tracking stays on-device — localStorage,
sessionStorage, cookies, and IndexedDB are the model's memory, not telemetry.

## Structure

- `public/js/engine/` — reactive state engine: typed event bus, rules
  resolver (priority / once / cooldown / phase gating), memory channels,
  dialogue rationing, phase machine, narrative spaces, debug overlay.
- `public/js/engine/sensors/` — instrumentation: pointer, scroll, input,
  presence, environment, meta (back button, devtools, reloads).
- `public/js/content/` — all reaction content as data. One module per
  trigger family plus generic fallbacks and the narrative spine (phases,
  lore artifacts, endings, post-game).
- `docs/VOICE.md` — the character. `docs/RULES.md` — the authoring format.

## Develop

Any static server over `public/` works:

    npx wrangler dev

## Debug overlay

Tap the footer copyright five times quickly, or append `?debug=1`. Shows
phase, action score, dispositions, recent events, last rule fired, and which
ending the current behavior would earn. `RESET ALL` wipes every memory
channel.

## Deploy

    npx wrangler deploy

Requires `CLOUDFLARE_API_TOKEN` in the environment (never in files).

## Coverage

    node tools/coverage.mjs

prints the trigger-family × phase matrix and total rule count.
