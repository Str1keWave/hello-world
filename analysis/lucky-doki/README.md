# "Lucky Doki" — DORIDORI (TAK × xei) — musical analysis

Written 2026-09-10. Two parts: a signal-analysis pipeline (`analyze_track.py`) and the
analysis below.

## Status of the audio analysis

The session's egress policy denied every audio host that was tried (YouTube, SoundCloud,
Spotify preview CDN, Apple/iTunes preview, Deezer, Bandcamp, archive.org), and also every
lyrics/wiki/press page. Only web-search snippets came through. So the numbers below that
come from the recording itself are **not** measured here. They come from published sources
(Chordify's automated transcription of the teaser, streaming-service metadata, Korean press
copy for the debut). Run the pipeline locally on the file to replace them with measurements:

```bash
pip install -r analysis/lucky-doki/requirements.txt
python3 analysis/lucky-doki/analyze_track.py "Lucky Doki.mp3" --out lucky_doki_analysis
```

It writes `report.json`, `report.md`, and `overview.png` (waveform + RMS, spectrogram,
chromagram, tempogram, beat-synchronous self-similarity). Smoke-tested on a synthetic
158 BPM E♭m7 → Bmaj7 → D♭maj7 → Fm7 loop: key and all four chords were recovered exactly;
the beat tracker reported the half-tempo (79), so the felt-tempo field normalises to 100–200.

## Verified facts

| item | value | source |
|---|---|---|
| artist | DORIDORI (도리도리), Korean co-ed duo: TAK (composer/producer/DJ), xei (vocal) | press, namu.wiki snippets |
| formed / debut | 2024-10-01 / 2024-10-09 with this single | press |
| composer, arranger | TAK | Apple Music / Melon credits |
| lyrics | xei, TAK | credits |
| length | 3:06 (186.25 s); an instrumental version ships on the single | Spotify metadata |
| tempo | 158 BPM | Chordify / streaming metadata |
| key | E♭ (chord set is E♭ minor / E♭ dorian) | Chordify |
| chords detected (teaser) | E♭m7, Bmaj7 (= C♭maj7), C7, D♭maj7, Fm7 | Chordify, automated |
| producer's own description | "minimal, addictive intro riff → rock → hyperpop → bebop in the solo part" | Korean press release, Oct 2024 |
| concept | "Doki" (heart-thump, everyday anxiety) vs "Lucky"; a track "like a magic spell" | press release |
| TAK background | Seo Taiji, Infinite, Lovelyz, Wanna One, NCT 127, Stray Kids, SEVENTEEN; EZ2ON and DJMAX rhythm-game songs; Vocaloid; hololive/STELLIVE VTuber songs; anime | namu.wiki / TAK site snippets |
| xei background | utaite / cover singer, "clear, limpid tone"; hikigatari (self-accompanied) clips on X and YouTube from 2023; agency SHINYROOM | namu.wiki snippet |
| follow-up | 도깨비꽃 (DKBK), 2025-04-15 | Spotify |

Lyric fragments (English renderings from the search snippets, so approximate):
"My days are filled with anxiety, teach me today's Lucky / Answer me, where is the end of
waiting, Doki"; "this way, that way" (이랬다가 저랬다); "the bus passes before I cross";
"I left my wallet at home again"; "but anyway, there's no need to worry, just remember one
thing: Lucky Doki yeah"; "이렇게 저렇게 la li la ta ta / aim of a precarious heart / call it:
Lucky Doki"; verse 2: "I can barely reach the person in the mirror, who are you? Lucky /
badump-badump, today's different from yesterday, Doki"; "forgot to charge my phone, battery
icon is red"; "it's our very own Lucky Doki".

## Derived numbers at 158 BPM, 4/4

| unit | duration |
|---|---|
| beat | 380 ms |
| 8th note | 190 ms |
| 16th note | 95 ms |
| bar | 1.52 s |
| 8-bar phrase | 12.2 s |
| whole track (186.25 s) | ≈ 122.5 bars ≈ 15 eight-bar phrases |

## The analysis

See the chat reply / the sections below.

### 1. Harmony: jazz vocabulary under a rock and hyperpop skin
Every detected chord is a seventh chord. In E♭ minor: E♭m7 is i7, C♭maj7 (spelled Bmaj7) is
♭VImaj7, D♭maj7 is ♭VII, Fm7 is ii7, C7 is V7/ii. Two things stand out.

- **Modal mixture between aeolian and dorian.** The ♭6 (C♭) lives in C♭maj7; the natural 6
  (C) lives in Fm7 and C7. Diatonic E♭ minor would give Fm7♭5, not Fm7. The song moves
  between the dark sixth and the bright sixth, which is the harmonic form of the title's
  Lucky/Doki ambivalence.
- **A built-in bebop cycle.** C7 → Fm7 is a secondary dominant resolving to ii, which sets up
  ii → V → i (Fm7 → B♭7 → E♭m7). That is the standard cell for bebop improvisation, so the
  "bebop solo" the press release names is not a genre stunt bolted on; the chord set of the
  song already carries it.
- **The Aeolian cadence for lift.** ♭VI → ♭VII → i (C♭ → D♭ → E♭m) is the anthem cadence of
  anime openings and J-rock; with maj7 extensions on ♭VI and ♭VII it reads as city-pop /
  fusion rather than power-chord rock. The rock lives in the drums and the guitar timbre,
  not in the harmony.

### 2. Tempo and rhythm: the tempo is the heartbeat
158 BPM is an anxious pulse, not a resting one. "Doki doki" is the onomatopoeia for a
pounding heart; "Lucky Doki" scans as two trochees (LUCK-y DO-ki), the "lub-dub lub-dub"
pattern. The hook is a heartbeat spoken over a heartbeat tempo. At 158 an 8th note is 190 ms,
about the fastest rate Korean syllables stay intelligible, which is why the verses are
rapid-fire lists (bus, wallet, battery) and the chorus falls back on "la li la ta ta":
semantically empty syllables let the melody run at 16th-note speed without losing the
listener.

### 3. Form: rhythm-game pacing
Three genre states (rock, hyperpop, bebop) plus a riff intro inside 122 bars means no
section outstays an 8-bar phrase. TAK writes for EZ2ON and DJMAX, where every 8 bars must
present a new "pattern" to the player; the same design pressure produces constant novelty
here, and the duo's name (도리도리, the side-to-side head shake) is the stated brief:
swing between genres.

### 4. Voice: a clear tone against a dense wall
xei comes from hikigatari covers: one voice, one instrument, phrasing carried by the
singer. Placing that limpid tone in front of a distorted, seventh-chord-heavy band, and
then presumably processing it in the hyperpop section, dramatises verse 2's "who is the
person in the mirror".

### 5. Lyric mechanics: the chorus is a coping mantra
The verses catalogue small failures; the pre-chorus ("but anyway, no need to worry, just
remember one thing") is the release; the chorus is a spell whose power is rhythmic rather
than semantic. The song is honest that the mantra doesn't fix anything ("today's different
from yesterday, Doki"), it just gives the panic a beat to sit on.

### 6. Cross-cultural engineering
A Korean act, a Japanese onomatopoeia, an English adjective, Korean verses, an instrumental
on the single for cover singers (which is how xei started), and a producer who works with
hololive and STELLIVE: the track is built for the K/J/EN subculture corridor, and the
Japanese-language and SE:A covers that followed are evidence it worked.

### What running the pipeline would settle
Whether the felt tempo is 158 or 79 (half-time verses?), the exact section map and bar
counts, whether the solo is swung (swing index), whether the hyperpop section is the
loudest or the sparsest (RMS and onset density per section), whether the key ever shifts
(8-beat key scan), the real chord loop of the chorus (the Chordify set is from the teaser
only), and xei's sung range (pyin on the harmonic layer).
