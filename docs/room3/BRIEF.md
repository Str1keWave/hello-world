# BRIEF — v3, after two failures

## The record

**v1** was a fake startup page (Loam) with 406 reaction rules. The audience's
verdict: overtriggering ("15 boxes queued up"), on-the-nose narration of
observations, cliché jaded-AI voice, no plot, reveal in 2 minutes, repetitive
after the ending. "Too much interaction logic with no real substance."

**v2** inverted it: an editing site that never spoke, changed only between
visits, ran on a real calendar across a week. The audience's verdict: it
sucked. "Nothing's happened." The pacing was infuriating, the waiting
mechanic broke immersion ("have I interacted enough to skip the day?"), the
whole surveillance-analytics vibe was off, and there was "very little real
interaction logic, at least not reactive, which is what it should have been."

Both are dead. Do not defend either. Do not build v1.5 or v2.5.

## The mandate (audience's words, binding)

- "The website is alive and can see you and is eventually trying to talk
  to you."
- LESS SURVEILLANCE-Y. It doesn't log you, analyze you, or keep records —
  it perceives you, the way a creature in a terrarium perceives the face at
  the glass. Present tense. No dossiers, no dashboards, no analytics fiction.
- REACTIVE, with substance. It responds to what you do AS you do it, and
  the responses accumulate into something — a relationship, a language, a
  story — rather than being one-off quips (v1's sin) or invisible ledger
  entries (v2's sin).
- ABSOLUTELY NO WAITING. No leave-and-come-back, no calendar, no clocks, no
  "return tomorrow," no gated real time. The whole experience must be
  playable in one sitting, driven entirely by interaction. (It may WELCOME a
  returning visitor gracefully, but must never require or reward waiting.)
- NOT LOAM. Completely different fiction, tone, name, frame. Nothing
  corporate, nothing analytics, nothing startup unless a pitch has an
  overwhelming reason.
- Full creative control granted. The frame, the entity, the tone, the
  ending — all open.

## The audience

Still one person, on a phone, who invented the original premise, has now
been burned twice, and gave the note themselves: alive → sees you → tries
to talk to you. They know that shape. The execution has to be better than
what they can imagine, because they will imagine plenty. They are also,
canonically, tired (their last message was a single weary emoji).

## Known traps (pre-convicted — pitching these is a failed pitch)

- The creature-learns-to-speak cliché reel: glitchy stutter text
  ("H-hello?"), Clippy-esque mascots, virtual pets, tamagotchi meters,
  zalgo, jump scares, "I've been waiting for you."
- Narrating what it perceives ("you moved your cursor!") — v1's disease in
  a fur coat.
- Aliveness asserted by words instead of demonstrated by behavior.
- Waiting in any costume, including "the creature is shy, come back later."
- Fake-broken states that read as actually broken (phone users bounce).

## Hard constraints

- Mobile-first: touch is the primary sense it has of the visitor. Must also
  work with a mouse. 390×844 is the canonical stage.
- Static hosting (GitHub Pages), all client-side, vanilla JS. Buttery on a
  mid-range phone: rAF, no layout thrash. prefers-reduced-motion respected.
- One-session arc: roughly 15–40 minutes of genuine content, escalating.
  A second session should be warm but never necessary.
- No emoji in the artifact. Exclamation marks rationed near zero.

## What the room owes

Not features. A THING — what it is, what it's like to be with it for half
an hour, why its attempts to talk are moving or funny or eerie, and how the
interaction mechanics ARE the story rather than decoration on it.
