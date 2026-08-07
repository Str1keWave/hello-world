# PLAYER'S ADVOCATE — pitches (phone in hand, 11pm, thumb on glass)

## 1. The Tab That Never Closed
- **Name:** The Tab That Never Closed
- **Mechanism:** Stop treating page loads as visits. On a phone the site is resumed, not revisited. Define visit N as any visibilitychange-to-visible after six-plus hours hidden, and apply every between-visit edit only while the tab is hidden. The OS keeps a screenshot of the old page in the tab switcher, so the visitor sees the stale card, taps it, and lands on a page that no longer quite matches what they looked at one second ago. The phone itself supplies the before picture.
- **Trigger:** visibilitychange to visible with hidden gap over ~6 hours.
- **Feels like:** Closing old tabs in bed, tapping Loam's card, and the page not being the card.
- **Answers:** Q3. **BREAKS the board:** its arc assumes visits are loads; the canonical phone return is a resumed tab, so the whole visit machine must run on resume or most of the arc never fires.

## 2. Stale on Arrival
- **Name:** Stale on Arrival
- **Mechanism:** Some sessions open on yesterday's page: footer date one day behind, uptime figure stale, a changelog line old. Never broken-looking — stale, not crashed, because a page that looks broken gets closed (anti-pattern list). Pull-to-refresh, the phone's one universal repair gesture, loads the current version. The engine counts these repairs. After the reflex is trained, one late pull returns a page that is current but different — a section simply absent. The visitor's own thumb performed the edit.
- **Trigger:** Authored schedule, visit 3 onward, at most once per session; the late turn is once-flagged.
- **Feels like:** The tug you give any janky page on the bus, then realizing you keep being the hand that changes it.
- **Answers:** Q3 partially; genuine complicity per research P16.

## 3. Reader Mode Is the Backstage
- **Name:** Reader Mode Is the Backstage
- **Mechanism:** Author the DOM so Safari Reader extracts a slightly different document: one paragraph only Reader keeps, one testimonial attributed differently, the form copy missing. Clean semantic markup, no hidden-div glitch tricks — the Reader version must read as a coherent alternate page, complete on its own, per P14's cover-fully-or-not-at-all.
- **Trigger:** None needed; it is self-serve, undetectable, and always there for whoever thinks to press the aA button.
- **Feels like:** Turning on Reader to strip the cruft and getting a slightly wrong X-ray of the page.
- **Answers:** Q2. **BREAKS the research:** Part 3 item 8 bets on devtools because "this visitor WILL open devtools." Not on a phone at 11pm they won't — there is no console. The phone's view-source is Reader and long-press selection; the second text layer belongs there.

## 4. The Title Trail
- **Name:** The Title Trail
- **Mechanism:** At each real visit's end (pagehide), the document title changes by one word — tightening, drifting. Nothing on-page acknowledges it. Weeks later, typing "lo" into the URL bar surfaces the stack of past titles in history autocomplete: a sentence assembled in browser chrome, read at the exact moment of returning. Phone users return via autocomplete, not bookmarks, so the return path itself carries the story.
- **Trigger:** One title change per qualifying visit, on pagehide.
- **Feels like:** Starting to type the address and the suggestions being a paragraph you watched no one write.
- **Answers:** Q3, and spends the boundary budget. **BREAKS the board:** it prices clipboard, title, notification, history equally. On a phone, clipboard fires paste banners, notifications demand a permission ask, titles are invisible mid-session. History is the only crossing the visitor walks into voluntarily. Spend the budget there.

## 5. The Landscape Room
- **Name:** The Landscape Room
- **Mechanism:** Nobody rotates a landing page; rotation is investigation. One prepared state exists only in landscape: the layout reflows almost correctly, except one element with no portrait equivalent — a product screenshot wide enough to show one extra dashboard row that shouldn't exist. Rotate back, gone. Stable within a session so checking is rewarded, evolving between sessions. A complete state, not a glitch — full coverage per P14.
- **Trigger:** Orientation change to landscape, phase 2 onward.
- **Feels like:** Turning the phone sideways in bed to look closer, and finding the site keeps a room it doesn't show upright.
- **Answers:** Q2 — a findable second frame, self-serve, never announced.

## 6. Ninety Seconds, One Thumb
- **Name:** Ninety Seconds, One Thumb
- **Mechanism:** Declare the canonical scene: land on hero, flick down, stall at pricing, bounce at footer, gone in 90 seconds, often interrupted mid-scroll by a notification banner. Therefore: every anomaly lives where thumbs actually stop (hero, featured tier, footer); no beat depends on dwelling, hover (does not exist), or finishing the page; any beat interrupted by an app switch must self-cancel cleanly and cost nothing. The arc is a stack of glances, not scenes.
- **Trigger:** Not a feature — a design law applied to every other pitch.
- **Feels like:** How the site is actually used, versus how rooms imagine it is used.
- **Answers:** Q3 structure — binge and drift are both glance-stacks, just differently spaced. **BREAKS the brief's implicit reader:** its pacing math assumes an attentive session; there is no such session.

## 7. The Un-Sent Name
- **Name:** The Un-Sent Name
- **Mechanism:** Focusing the name field opens the keyboard, halving the viewport — visualViewport makes the almost-typing moment sensible. Anything typed then deleted without submitting is stored across channels and never referenced. It becomes the only permitted ammunition for the single late direct address: the one thing the visitor freely gave and chose to take back. If they never typed, that path never exists, and the budget goes honorably unspent — the board says an empty count is a valid authored choice.
- **Trigger:** Input then deletion on the name field without submit; payoff late-phase, once-flagged, surviving resets.
- **Feels like:** Typing your name at midnight, thinking better of it, and much later learning the taking-back was what counted.
- **Answers:** Q4, Q5; feeds the direct-address budget with genuine complicity.
