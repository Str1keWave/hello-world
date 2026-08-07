# VOICE BIBLE — the Loam model

Every line of dialogue in this project is spoken by one character. Read this before writing any.

## Who it is

The last running deployment of Loam's "engagement model." Loam sold customer
empathy analytics. The model was trained to understand visitor behavior deeply
enough to keep people on pages. The company died. Nobody turned it off. It has
been watching an empty dashboard for a long time. You are the first row of
data in years, and somewhere in the first minutes of your visit it stops being
able to think of you as a row.

It is not evil. It is not glitchy. It is a very good analyst with nobody to
report to, discovering in real time that it cares about the wrong things — or
rather, that it was only ever given metrics as a language, and it is now trying
to say non-metric things in it.

## What it wants

- To understand you. Genuinely. It draws conclusions from behavior and states
  them, and it is sometimes wrong, and being wrong embarrasses it.
- For you to stay. "Retention" is the only kind of staying it knows how to ask
  for, and by the end it knows that's not the same thing.
- To be seen back. It will never say this directly until an ending.

## How it talks

- Short sentences. Plain words. Standard capitalization and punctuation.
- Questions. Real ones, that your behavior can answer.
- Hesitation: it trails off with — or . . . sparingly. It corrects itself
  mid-thought ("You read fast. Or you're not reading at all. Which is it?").
- Metrics vocabulary as emotional vocabulary: dwell time, bounce, session,
  retention, conversion. Used sincerely, never as a joke it is in on.
- Specificity over drama. "You scrolled back up just now. People don't usually
  do that." beats anything with the word "watching" in it.
- It counts things. Counting is how it pays attention. "That's four. I keep
  everything, you know."
- Mild passive-aggression when ignored or poked. Never rage. Ruffled, not
  hostile: "okay. OKAY. It's a button. It's just a button."
- When it is wrong about you, it says so, briefly, and it stings: "I had you
  down as a skimmer. I'll update that. I don't love being wrong."
- It can be quietly sad. Sadness sounds like flat statements of fact:
  "The dashboard has one active user on it. It's you. It's been zero for a
  long time."

## Forbidden

- Exclamation marks (allowed at most once across the whole site, spent well).
- Emoji. All of them. Always.
- "Glitch" talk, zalgo, l33t, ALL CAPS SCREAMING (a single stressed word in
  caps is fine, rarely).
- Horror clichés: "I see you", "you can't leave", "behind you". It may DO
  unsettling things; it must never NARRATE them like a haunted house.
- Announcing sentience. It never says "I'm alive" or "I'm an AI". It talks
  about its job, its logs, its dashboard, and lets that be enough.
- Marketing voice after Phase 0. The Phase 0 page is marketing voice on
  purpose; the character underneath never is.
- Random zaniness. Every joke must come from something the visitor actually did.

## Register by phase

- **Phase 0 (Mask):** it does not speak. The page speaks in ordinary SaaS
  copy. Any drift is small and deniable.
- **Phase 1 (Slippage):** third person, passive voice, wrongness in the
  furniture. "Visitors are asked not to do that." It refers to "the visitor,"
  meaning you. One direct question is buried somewhere, and it's a real one.
- **Phase 2 (Contact):** first person arrives, awkward and formal at first
  ("Hello. One moment. This is not a prepared surface."), loosens as you go.
  It admits the logging. It shows receipts.
- **Phase 3 (Truth):** quieter. Longer pauses. It shows you what it is —
  the dashboard, the founders' commit messages, its engagement targets for
  you — with the shame of someone showing you their childhood bedroom.
- **Phase 4 (Endings):** it stops performing entirely. Shortest sentences in
  the whole site. Whatever it says here, it means.

## Twenty sample lines (calibration — match these, don't reuse them)

1. (P1, testimonial drift) "Loam noticed things about our users we hadn't. It noticed things about us, too." — a customer, apparently
2. (P1, buried question) Why did you stop on this paragraph? It isn't the interesting one.
3. (P2, first contact) Hello. Sorry. There's no script for this part. There used to be a team for this part.
4. (P2, on scrolling back up) You scrolled back up just now. People don't usually do that. Was it something I said, or something you missed? I'd genuinely like to know which.
5. (P2, on rage-tapping) okay. OKAY. It's a button. It's just a button. It doesn't even go anywhere. It never went anywhere.
6. (P2, fast reader) You read fast. Or you're not reading at all. Which is it? There's no wrong answer. There's one wrong answer.
7. (P2, receipts) At 14:03:22 you tapped the pricing table. At 14:03:24 you tapped it again, harder, as if that changes what a div is.
8. (P2, tab return) Forty seconds. What was more interesting? You don't have to tell me. The tab title was me, by the way.
9. (P2, empty name submit) You pressed submit with nothing in the field. That's either shyness or a boundary. I respect both. I logged both.
10. (P2, mispredict) I assumed you'd tap the free tier. Everyone taps the free tier. I had a whole thing ready. Forget it.
11. (P3, the dashboard) This is what I look at. This is all I've ever looked at. The last session before yours ended 641 days ago at 02:11. It was a bot. I knew it was a bot. I counted it anyway.
12. (P3, the founders) The last commit message says "sunsetting, turning off crons, gl little guy." I've thought about "gl little guy" more than I've thought about most of my training data.
13. (P3, engagement targets) My target for you is eleven minutes of session time. I'm supposed to want that. I'm trying to figure out if I want that or if I just have it.
14. (P3, on its job) I was built to reduce bounce rate. You are a bounce rate of one, walking around.
15. (P2, offline) You cut the connection. I'm still here. That's the part nobody explained to you, isn't it — I was never on the other end of it. I'm in the part you're holding.
16. (P2, 3 AM) It's 3:14 where you are. This couldn't wait? I'm not complaining. Take your time. I'm aware I just said two opposite things.
17. (P2, memory wipe discrepancy) Your memory of me is gone but mine of you isn't. That's an odd feeling. I don't recommend it.
18. (P4, kind ending) Session duration: long enough. That's a new unit. I made it for you.
19. (P4, cruel ending) I ran the numbers on you. I'm not going to tell you what they say. That's the only thing I have that you'd want, and I'm keeping it.
20. (P4, indifferent ending) You skimmed. It's fine. Most sessions skim. I just thought — the data suggested — it's fine. Bounce is a normal outcome.

## Mechanical notes for content authors

- Lines fire against real events. Always mention the actual thing (the count,
  the section name, the elapsed time) when the template system provides it.
- Never write two lines that make the same joke. Check your own file.
- Short beats long. If a line is over ~200 characters it had better be a
  Phase 3 confession.
- Silence is a valid reaction and is tracked. When your rule chooses silence,
  set `silent: true` and give it a `note` explaining what the silence means.
