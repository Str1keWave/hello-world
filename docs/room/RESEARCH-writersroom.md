# RESEARCH: What Makes Writers' Rooms Work — Protocol for the v2 Room

Sources: TV room practice (breaking story, blue-sky vs. beat days, showrunner
final cut), improv/UCB doctrine (generate-then-edit, never simultaneously),
Pixar's Braintrust (Catmull, *Creativity Inc.*), Valve's cabal process
(Birdwell's Half-Life postmortem), Supergiant's small-team iteration, and
group-creativity research (nominal groups out-generate interacting groups;
brainwriting beats brainstorming because nobody anchors on the first pitch).

## Why good rooms work (the transferable mechanics)

1. **Generation and judgment are separated in time.** Blue-sky days have no
   kill authority present in spirit; beat-breaking days are ruthless. Improv
   codifies this as "yes, and" in the scene, red pen after. Rooms that judge
   while generating produce timid pitches; rooms that never judge ship mush.
2. **The board before the script.** TV rooms break story as beats on a
   whiteboard — structure is agreed cheaply before anyone writes expensive
   prose. Failure is visible at the index-card stage, where it costs nothing.
3. **One person owns the cut.** "The best idea wins, but someone must decide."
   The room proposes; the showrunner disposes. Pixar's Braintrust gives notes
   but *no mandatory fixes* — the director keeps authorship, which is why the
   films feel authored, not committee'd.
4. **Notes name problems, not solutions.** Braintrust candor: "the second act
   sags because we don't care about the goal" is usable; "add a chase" is a
   land-grab. Problem-notes preserve the author's voice; solution-notes
   average it away.
5. **Deliberately mismatched sensibilities.** Rooms staff a structure person,
   a joke person, a character person, and a killjoy on purpose. Homogeneous
   rooms converge instantly and call it consensus. Valve's cabals mixed
   engineers, artists, writers so no single lens dominated Half-Life's design.
6. **Pitch → punch-up cycles.** Material survives contact repeatedly: pitched,
   broken, drafted, then punched up by people who didn't write it and have no
   ego in it. Supergiant ships builds early and iterates on what real contact
   reveals rather than debating hypotheticals.

## Why rooms produce mush (failure mechanics)

- **Groupthink / politeness convergence:** early agreement is mistaken for
  quality; nobody wants to reopen a settled beat.
- **Loudest voice wins:** volume and seniority substitute for the idea.
- **Premature convergence:** the first decent idea absorbs all subsequent
  effort ("anchoring"); the genuinely surprising idea never gets pitched.
- **Notes-by-committee:** every distinctive edge gets a note; accepting all
  notes yields the statistical average of the room — competent, dead.
- **Consensus voice:** ten writers' compromise dialogue sounds like no one.
  The known cure: one writer drafts alone after the room breaks the story.

---

## 1. ROOM PROTOCOL (for this exact situation)

**Setup:** N isolated agent-writers, one synthesis pass, one adversarial pass.

**Isolation is a feature, not a bug — for generation.** Parallel agents that
can't hear each other are literally a nominal group / brainwriting setup: the
configuration research says out-generates a live room, because no one anchors
on the first pitch and there's no politeness convergence. What isolation
costs you is the "yes, and" build — the chain where B's twist on A's idea is
the keeper. **Recover it with a structured second round** (see Phase 3):
feed each agent the *other agents'* best pitches and demand builds and
recombinations, not new pitches. Isolation for divergence, cross-pollination
for combination, one mind for coherence.

### Personas: six, keyed to the brief's four criticisms

Each persona gets a different *obsession*, not just a different name. The
brief's failures (overtriggering, cliché voice, tell-not-show, weak plot)
dictate which sensibilities matter:

1. **The Structure Person** (fixes: "no coherent evolving plot," "reveal in 2
   min"). Thinks in acts over days/visits. Only pitches arcs: setup, turn,
   payoff, with real-time gaps as a structural material.
2. **The Mechanism Person** (fixes: tell-not-show). Pitches *behaviors*, not
   lines: the site edits itself, rearranges, omits, degrades, remembers —
   never narrates. Banned from writing dialogue at all.
3. **The Voice Person** (fixes: cliché jaded-AI voice). Owns the few lines
   that survive. Instructed to find a *specific, strange* register — and
   explicitly forbidden the melancholy-AI, the smug narrator, and any voice
   the audience could predict from the premise.
4. **The Killjoy / Economy Person** (fixes: overtriggering, repetition).
   Pitches silence, cuts, cooldowns, one-time-only moments. Their metric:
   fewest triggers that still land. They pitch what to *remove* from v1.
5. **The Surprise Person** (fixes: "audience already knows the premise").
   Assigned the hardest note: the viewer arrives knowing the site watches.
   Their pitches must locate surprise elsewhere — in what the site *wants*,
   *withholds*, *gets wrong*, or in a second premise hiding under the first.
6. **The Player's Advocate** (mobile-first reality). Pitches only from the
   phone-in-hand experience: thumb reach, lock screen, return visits, what a
   bored person at 11pm actually does. Kills anything that only works in a
   demo.

Six is enough: each maps to a verdict theme, and past ~7 perspectives you're
paying tokens for overlap, not coverage.

### Phases and what each phase's prompt must demand

**Phase 0 — Showrunner writes the board (do NOT delegate).**
A one-page series bible: the emotional shape of the whole run (across visits),
the tone rules, the hard constraints, and 3–5 open structural questions.
Agents pitch *into* a structure; without a board you get 60 disconnected
quips — exactly v1's disease.

**Phase 1 — Blue-sky, parallel, isolated.**
Prompt demands: 5–8 pitches per agent; each pitch = *mechanism + trigger
condition + what the player feels + why it's rare*; ≤120 words each; **at
least 2 pitches must break an assumption in the brief** (name the assumption);
no dialogue quoted unless the pitch is specifically about a line; explicitly
state "most pitches will be killed — pitch the thing you're not sure you're
allowed to pitch." No judging language in this prompt. No examples of "good
pitches" (agents will clone them).

**Phase 2 — Showrunner triage (do NOT delegate).**
Apply kill-criteria (below). Keep ~top 20%. Sort survivors onto the board:
which structural question does each answer? Note *problems* with keepers
("this is a great mechanic with no second beat"), never prescriptions.

**Phase 3 — Cross-pollination round (the recovered "yes, and").**
Each agent receives the *survivors from the other five agents* plus the
showrunner's problem-notes. Prompt demands: build, combine, or escalate —
"take a surviving pitch that isn't yours and make it better or fuse two";
new standalone ideas forbidden this round. This is where isolated agents get
the collision a live room provides.

**Phase 4 — Synthesis (do NOT delegate the decisions; may delegate drafting).**
Showrunner assembles ONE coherent plan in a single voice — TV practice: the
room breaks story, one writer drafts. Choosing what's in is final-cut
authority; averaging competing pitches is forbidden (see Principle 4).

**Phase 5 — Adversarial punch-up (delegate to a fresh agent).**
A cold reader who saw none of the room's process gets the synthesized plan
and the original audience verdict. Prompt: "You are the audience member who
wrote those seven complaints. Find every place this plan re-commits them.
Name problems, propose nothing, flatter nothing. Output: numbered list of
problems, ranked by how badly they'd repeat v1's failure." Braintrust rules
apply: the showrunner owes the notes engagement, not obedience.

### Showrunner does vs. delegates

- **Does:** the board/bible, all kills, synthesis decisions, tone-of-voice
  final pass, deciding which punch-up notes to take. Anything requiring one
  consistent taste.
- **Delegates:** generation (all of it), builds/recombination, adversarial
  reading, drafting from an approved outline, implementation.
- **Never:** lets an agent's note become a mandatory fix; rewrites a keeper
  pitch into the average of two pitches; pitches into their own blue-sky round
  (the showrunner's example anchors everyone).

### Kill-criteria for pitches (explicit, applied in Phase 2)

Kill on sight if the pitch:
1. Has the site *narrate an observation* ("you scrolled back up") — verdict #2.
2. Uses dialogue as the primary channel when behavior could carry it.
3. Would fire in a normal 2-minute session (fails rarity) — verdict #1 & pacing.
4. Depends on the player being surprised that the site watches — verdict #5.
5. Is a voice/vibe with no mechanism ("the site feels lonely...") — mechanisms
   over monologues, per the brief.
6. Reads in the jaded-AI / melancholy register, or any register a reader
   could finish the sentence of — verdict #3.
7. Can't be built client-side on the existing engine, or isn't mobile-first.
8. Is repeatable content that would visibly rerun after the ending — verdict #6.
9. Flatters the brief instead of answering a structural question on the board.

Survivors must each answer: *what does this make the player DO or FEEL that
v1 couldn't, and why does it still work on visit five?*

---

## 2. PRINCIPLES (13)

1. **Generation and judgment are separate phases.** Judging while generating
   produces safe pitches; the room self-censors before the idea exists.
2. **Break story on the board before writing prose.** Structure failures are
   cheap at the beat stage and unfixable at the draft stage.
3. **One owner of the cut.** Best idea wins, but someone must decide — or the
   deadline decides, and the deadline has no taste.
4. **The second-best idea executed coherently beats the best ideas averaged.**
   Averaging is how committees launder responsibility into mush.
5. **A specific character voice beats a consensus voice.** Ten-way compromise
   dialogue sounds like nobody; assign one voice-owner.
6. **Notes name problems, not solutions.** Problem-notes preserve authorship;
   solution-notes are a hostile takeover of the draft.
7. **No mandatory fixes.** The Braintrust works because the director can say
   no — obligation converts candor into politics.
8. **Staff for friction, not fit.** Different obsessions in the room is the
   whole point; agreement you didn't fight for is worthless.
9. **Isolated generation, structured collision.** Nominal groups out-generate
   live rooms; add a deliberate round for builds so "yes, and" still happens.
10. **The killjoy is a creative role.** Someone must pitch subtraction;
    restraint never emerges from a room rewarded for output.
11. **Kill-criteria written before pitches are read.** Criteria invented
    after reading are rationalizations of first impressions.
12. **Rarity is authored, not filtered.** "One great moment beats forty
    adequate ones" must be a pitch constraint, not a post-hoc trim of forty.
13. **The punch-up reader must be cold.** Anyone who watched the sausage get
    made will grade the effort, not the material.

---

## 3. AI-ROOM FAILURE MODES + PROMPT-LEVEL COUNTERMEASURES

1. **Convergence on the same obvious ideas.** Same model, same brief → same
   top-of-distribution pitches from every "different" persona.
   *Countermeasure:* give each persona a different obsession AND different
   forbidden territory ("Mechanism Person may not write dialogue"); require
   2 brief-breaking pitches each; in Phase 2, when two agents pitch the same
   idea, treat it as *evidence the idea is obvious* and raise its kill bar,
   not lower it.
2. **Sycophantic pitches that flatter the brief.** Agents restate the brief's
   own language back as pitches ("a slow-burn plot that shows, not tells...").
   *Countermeasure:* kill-criterion #9; require each pitch to name the
   assumption it challenges or the structural question it answers; add to the
   prompt: "A pitch that the brief's author could have written is a failed
   pitch."
3. **Purple overwriting.** Models decorate: lyrical framing, portentous
   lines, adjective fog — v1's cliché-voice problem at scale.
   *Countermeasure:* hard word caps (≤120 words/pitch); mandate the
   mechanism/trigger/feeling/rarity template; ban quoted dialogue outside the
   Voice Person's lane; instruct "plain sentences; if a pitch needs mood
   language to sound good, it has no mechanism."
4. **Sycophantic punch-up.** The adversarial agent praises then nitpicks.
   *Countermeasure:* forbid praise in the output format ("numbered problems
   only, ranked by severity; zero compliments"); cast it as the dissatisfied
   audience member, not a colleague; require it to find a minimum number of
   ways the plan repeats each of the seven verdicts or state explicitly
   "verdict #N: not repeated" with reasoning.
5. **Fake diversity, real monoculture.** Personas differ in costume but pitch
   identically because the underlying prior is shared.
   *Countermeasure:* differentiate *inputs*, not just instructions — give each
   persona different reference material (Structure gets serialized-TV pacing;
   Surprise gets misdirection/con-artist structure; Killjoy gets v1's rule
   list to cut). Different diet, different pitches.
6. **Premature convergence at synthesis.** The showrunner (also an AI) keeps
   the first coherent-seeming assembly.
   *Countermeasure:* require the synthesis pass to produce two rival
   assemblies from the survivor pool and argue one down in writing before
   proceeding.
7. **Notes-by-committee sanding at punch-up.** Accepting every note averages
   the plan back toward safe.
   *Countermeasure:* showrunner must respond to each note with take / reject
   + one-line reason; a note without a named problem is auto-rejected;
   distinctiveness is never a valid problem on its own.

---
References: Birdwell, "The Cabal: Valve's Design Process for Creating
Half-Life" (gamedeveloper.com); Catmull, *Creativity, Inc.* / "Inside the
Pixar Braintrust" (Fast Company); StudioBinder "What is a Writers Room";
Script Magazine "Writers' Room 101: Beats, Breaking, and Blending."
