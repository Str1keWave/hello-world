# "Lucky Doki" — DORIDORI (TAK × xei) — musical analysis

Written 2026-09-10, measured 2026-09-11 on the official MV audio (mp3, 192 kb/s, 44.1 kHz,
stereo, 3:33 — the MV cut is 27 s longer than the 3:06 single: about 6 s of MV intro and
about 20 s of outro). The audio itself is not committed. Pipeline: `analyze_track.py`
(generic pass) plus the targeted passes described below; figures: `overview.png`,
`timeline.png` (loudness, bass pitch, chroma with bar numbers), `zoom.png`
(mel spectrograms of the drop, the hyperpop section and the solo). Raw numbers from the
generic pass are in `report.json`.

```bash
pip install -r analysis/lucky-doki/requirements.txt
python3 analysis/lucky-doki/analyze_track.py "Lucky Doki.mp3" --out lucky_doki_analysis
```

## Measured

| quantity | value | method |
|---|---|---|
| tempo | 156.0 BPM (155.6–156.3 per section; grid-locked, no drift) | onset autocorrelation, 5.8 ms hop, parabolic peak |
| tuning | A440 (+0.02 semitones) | librosa.estimate_tuning |
| meter | 4/4, bar = 1.539 s, 8-bar phrase = 12.3 s | downbeat phase from low-band energy |
| integrated loudness | −9.7 LUFS, peak −0.8 dBFS, crest 11.7 dB | pyloudnorm |
| short-term loudness | verses −10.5, choruses −7.6 to −8.0, drop −8.3, solo −15, intro riff −19 LUFS | 3 s windows |
| verse key | E♭ minor (Krumhansl 0.65–0.77); G/G♭ ratio 0.44, almost no E or G | harmonic-layer chroma from C3 up (kick-proof) |
| chorus key | F minor (Krumhansl 0.78–0.81); G/G♭ 2.0, C/C♭ 2.3, E natural present | same |
| solo key | F minor (0.84, strongest fit in the song) | same |
| verse riff | E♭m – B♭m – C♭maj7 – D♭ (i, v, ♭VI, ♭VII), two chords per bar | bass root line + chroma quality |
| chorus bass | G, C, F dominate (ii, V, i in F minor); C7 detected repeatedly | drum-excluded bass pyin |
| drop (62–74 s) | F pedal, 81 % of bass frames on F, hard 8th/quarter gating | bass pyin + spectrogram |
| solo bass | F–G–F–C, then G♭–A♭–D♭–F–C, register an octave up (median F3) | bass pyin per bar |
| solo lead | E♭ F E♭ G G E♭ E♭ F **E** F F F C: chromatic E→F approach, straight 8ths, no triplets | pyin note events; onset grid |
| swing | none anywhere (triplet-position onsets ≤ 4 %) except the 4-bar pre-chorus 2 (22 %) | onset phase vs 156 grid |
| 16th-note density | hyperpop section 21 % of onsets on 16ths vs ≤ 2 % elsewhere; highest drum onset rate (4.9/s) | onset phase; percussive onsets |
| stereo width | verses −15 to −21 dB side/mid (narrow); choruses −6 to −8 dB; drop −5.5 dB (widest) | mid/side RMS |
| spectral tilt | verse sub-bass share 0.19–0.24; chorus 0.07; solo 0.013 (no low end at all) | STFT band energy |
| sung range | ≈ C4–C5; chorus centres on A♭4–B♭4 | pyin on band-passed mid channel |
| melody pitch sets | verse: E♭ G♭ A♭ B♭ D♭ (+F); chorus: F A♭ B♭ C (+E♭) — both pentatonic-based | pitch-class histograms of tracked voice |

## Section map (MV timing; bar 1 = 0.2 s)

| bars | time | section | key | notes |
|---|---|---|---|---|
| 1–6 | 0:00–0:09 | MV intro | – | SFX, no low end |
| 7–10 | 0:09–0:15 | intro riff | E♭m | E♭ minor pentatonic riff, hits on beats 1 and 3, −19 LUFS, sub-heavy |
| 11–30 | 0:15–0:46 | verse 1 + pre | E♭m | 20 bars; riff loop continues under rapid-fire vocal |
| 31–32 | 0:46–0:48 | break | | 1-bar stop |
| 33–40 | 0:48–1:00 | chorus 1 | Fm | 8 bars, −8 LUFS, wide |
| 41–48 | 1:00–1:14 | drop / post-chorus | F pedal | gated pumping pedal, vocal chops, widest stereo |
| 49–55 | 1:14–1:25 | riff 2 | E♭m | back down a whole step, −14 LUFS |
| 56–65 | 1:25–1:40 | verse 2 | E♭m | shorter than verse 1 |
| 66–69 | 1:40–1:46 | pre-chorus 2 | A♭ pedal | triplet fill feel, chromatic climb D♭–D–E♭ |
| 70–77 | 1:46–1:58 | chorus 2 | Fm | 8 bars |
| 78–90 | 1:58–2:19 | hyperpop section | Fm/Cm | 16th-note stutters, risers, densest drums, voice barely trackable (processed) |
| 91–100 | 2:19–2:36 | bebop solo + build | Fm | −15 LUFS, band-passed, walking-register bass, chromatic lead |
| 101–125 | 2:36–3:13 | final chorus ×3 | Fm | 24 bars, loudest (−7.2 to −8 LUFS) |
| 126–138 | 3:13–3:33 | MV outro | – | fade |

## Published facts (from search snippets)

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


## The analysis (measured version)

1. **Two keys, one singer register.** Verses are E♭ minor, aeolian, riff-driven: i, v, ♭VI,
   ♭VII with no leading tone. Every chorus is F minor, a whole step up, with a functional
   ii–V–i (Gø–C7–Fm) and the E-natural leading tone. The melody stays pentatonic in both
   keys and the singer's tessitura stays around A♭4–B♭4, so the chorus feels lifted without
   being sung higher. Modal rock verse, functional jazz-pop chorus: the harmonic language
   changes with the genre.
2. **The bebop solo is prepared, not pasted.** The chorus already carries ii–V–i in F minor.
   The solo stays in F minor (the song's strongest key fit), the bass walks an octave up
   (median F3), the low end is filtered out entirely (sub-bass share 0.013), and the lead
   plays straight 8ths at 156 with chromatic approach tones (E→F). It is bebop vocabulary
   at rock tempo, not swung jazz.
3. **156 BPM = the heartbeat.** 8th note 192 ms, 16th 96 ms. "Lucky Doki" = two trochees,
   lub-dub lub-dub, over a pulse in the anxious-heart range.
4. **Dynamics are engineered, not flattened.** −9.7 LUFS integrated is a hot K-pop master,
   but the arrangement still drops 7 dB into the solo and 11 dB into the intro riff.
   Stereo width doubles from verse (centered riff) to chorus (hard-panned doubles), and the
   spectral centre moves from sub-bass (verse 0.2 share) to mids/highs (chorus 0.07).
5. **Form at rhythm-game pace.** Nothing lasts longer than 8 bars except the 24-bar final
   chorus; each genre state gets its own signature: gated pedal (drop), 16th stutters
   (hyperpop), band-pass and walking bass (bebop), wall of doubled guitars (chorus).
