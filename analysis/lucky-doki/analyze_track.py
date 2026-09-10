#!/usr/bin/env python3
"""
analyze_track.py — deep signal-level analysis of a music file for musical interpretation.

Usage:
    python3 tools/analyze_track.py path/to/song.mp3 [--out report_dir]

Requires: pip install librosa soundfile numpy scipy matplotlib
(ffmpeg on PATH, or `pip install imageio-ffmpeg`, for mp3 decoding)

Produces in --out (default: ./analysis_<stem>/):
    report.json      every numeric result below
    report.md        human-readable summary
    *.png            waveform+RMS, spectrogram, chromagram, tempogram, self-similarity

Extracted elements:
    * tempo (global + local curve), beat grid, downbeats (4/4 assumption), swing ratio
    * key (Krumhansl-Schmuckler over full song and per section) + key-change scan
    * chord estimate per beat (24 major/minor templates + dim/aug/sus fallbacks)
    * structural segmentation (recurrence + spectral clustering), section labels A/B/C...
    * dynamics: RMS/LUFS-ish loudness per section, crest factor, dynamic range, loudness arc
    * spectral: centroid, bandwidth, rolloff, flatness, contrast per section (brightness, density)
    * harmonic/percussive energy ratio per section (guitar-wall vs. beat-forward sections)
    * onset density (notes per second) per section — finds the "bebop solo" style bursts
    * pitch (pyin) on the harmonic layer to sketch the vocal/lead range + melodic contour stats
    * stereo width per section (if stereo)
"""
import argparse, json, os, sys, math
import numpy as np

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audio")
    ap.add_argument("--out", default=None)
    ap.add_argument("--sr", type=int, default=22050)
    args = ap.parse_args()

    import librosa, librosa.display
    import scipy.signal as sps
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    stem = os.path.splitext(os.path.basename(args.audio))[0]
    out = args.out or f"analysis_{stem}"
    os.makedirs(out, exist_ok=True)
    R = {"file": args.audio}

    # ---------- load ----------
    y_st, sr = librosa.load(args.audio, sr=args.sr, mono=False)
    if y_st.ndim == 1:
        y_st = y_st[None, :]
    y = librosa.to_mono(y_st)
    dur = len(y) / sr
    R["duration_s"] = round(dur, 2)
    R["channels"] = int(y_st.shape[0])
    hop = 512

    # ---------- tempo / beats ----------
    oenv = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop, aggregate=np.median)
    tempo, beats = librosa.beat.beat_track(onset_envelope=oenv, sr=sr, hop_length=hop, trim=False)
    tempo = float(np.atleast_1d(tempo)[0])
    beat_t = librosa.frames_to_time(beats, sr=sr, hop_length=hop)
    ibi = np.diff(beat_t)
    R["tempo_bpm_global"] = round(tempo, 2)
    R["tempo_bpm_from_beats_median"] = round(60 / np.median(ibi), 2) if len(ibi) else None
    R["tempo_stability_cv"] = round(float(np.std(ibi) / np.mean(ibi)), 4) if len(ibi) else None
    # local tempo curve (dynamic programming per window)
    tg = librosa.feature.tempogram(onset_envelope=oenv, sr=sr, hop_length=hop)
    tempo_local = librosa.feature.tempo(onset_envelope=oenv, sr=sr, hop_length=hop, aggregate=None)
    R["tempo_local_percentiles"] = {p: round(float(np.percentile(tempo_local, p)), 1) for p in (5, 25, 50, 75, 95)}
    # half/double-time candidates
    ac = librosa.autocorrelate(oenv)
    # octave ambiguity: beat trackers often halve 150-180 bpm rock; report the "felt" tempo too
    felt = tempo
    while felt < 100: felt *= 2
    while felt > 200: felt /= 2
    R["tempo_bpm_felt_(octave_normalised_100-200)"] = round(felt, 2)

    # swing ratio: onset energy at 8th-note offbeat positions vs straight vs triplet
    swing = None
    if len(beat_t) > 8:
        frac = []
        onsets = librosa.onset.onset_detect(onset_envelope=oenv, sr=sr, hop_length=hop, units="time")
        for o in onsets:
            i = np.searchsorted(beat_t, o) - 1
            if 0 <= i < len(beat_t) - 1:
                frac.append((o - beat_t[i]) / (beat_t[i + 1] - beat_t[i]))
        frac = np.array(frac)
        hist, edges = np.histogram(frac, bins=12, range=(0, 1))
        R["onset_position_histogram_12ths"] = hist.tolist()
        straight = hist[5] + hist[6]     # ~0.5
        trip = hist[7] + hist[8]         # ~0.667
        swing = round(float(trip / (straight + 1e-9)), 3)
    R["swing_index_(>1 leans_triplet/shuffle)"] = swing

    # ---------- key ----------
    y_h, y_p = librosa.effects.hpss(y)
    chroma = librosa.feature.chroma_cqt(y=y_h, sr=sr, hop_length=hop)
    NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    maj = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
    mnr = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])

    def ks_key(ch):
        v = ch.mean(axis=1)
        scores = []
        for i in range(12):
            scores.append(("%s major" % NOTES[i], float(np.corrcoef(np.roll(maj, i), v)[0, 1])))
            scores.append(("%s minor" % NOTES[i], float(np.corrcoef(np.roll(mnr, i), v)[0, 1])))
        scores.sort(key=lambda x: -x[1])
        return scores

    ks = ks_key(chroma)
    R["key_global_top5"] = [{"key": k, "corr": round(c, 3)} for k, c in ks[:5]]
    R["key_global"] = ks[0][0]
    # key change scan in 8-beat windows
    keys_over_time = []
    if len(beats) > 16:
        for i in range(0, len(beats) - 8, 8):
            a, b = beats[i], beats[i + 8]
            k = ks_key(chroma[:, a:b])[0][0]
            keys_over_time.append({"t": round(float(beat_t[i]), 2), "key": k})
    R["key_over_time_8beat"] = keys_over_time
    changes = [k for j, k in enumerate(keys_over_time) if j and k["key"] != keys_over_time[j - 1]["key"]]
    R["key_change_candidates"] = changes[:40]

    # ---------- chords per beat ----------
    templates = {}
    for i in range(12):
        t = np.zeros(12); t[[i, (i + 4) % 12, (i + 7) % 12]] = 1; templates[NOTES[i]] = t
        t = np.zeros(12); t[[i, (i + 3) % 12, (i + 7) % 12]] = 1; templates[NOTES[i] + "m"] = t
        t = np.zeros(12); t[[i, (i + 3) % 12, (i + 6) % 12]] = 1; templates[NOTES[i] + "dim"] = t * 0.9
        t = np.zeros(12); t[[i, (i + 5) % 12, (i + 7) % 12]] = 1; templates[NOTES[i] + "sus4"] = t * 0.9
        t = np.zeros(12); t[[i, (i + 4) % 12, (i + 7) % 12, (i + 10) % 12]] = 1; templates[NOTES[i] + "7"] = t * 0.95
        t = np.zeros(12); t[[i, (i + 4) % 12, (i + 7) % 12, (i + 11) % 12]] = 1; templates[NOTES[i] + "maj7"] = t * 0.95
        t = np.zeros(12); t[[i, (i + 3) % 12, (i + 7) % 12, (i + 10) % 12]] = 1; templates[NOTES[i] + "m7"] = t * 0.95
    names = list(templates); T = np.stack([templates[n] / np.linalg.norm(templates[n]) for n in names])
    chroma_sync = librosa.util.sync(chroma, beats, aggregate=np.median)
    cs = chroma_sync / (np.linalg.norm(chroma_sync, axis=0, keepdims=True) + 1e-9)
    sim = T @ cs
    chord_idx = sim.argmax(axis=0)
    chords = [names[i] for i in chord_idx]
    # collapse runs
    runs = []
    for i, c in enumerate(chords):
        t = float(beat_t[i]) if i < len(beat_t) else dur
        if runs and runs[-1]["chord"] == c:
            runs[-1]["beats"] += 1
        else:
            runs.append({"t": round(t, 2), "chord": c, "beats": 1})
    R["chords_per_beat_runs"] = runs
    from collections import Counter
    R["chord_histogram"] = Counter(chords).most_common(15)
    # 4-chord loop detection: most common 4-bar (16-beat) pattern of bar-level chords
    bars = [Counter(chords[i:i + 4]).most_common(1)[0][0] for i in range(0, len(chords) - 3, 4)]
    R["bar_chords"] = bars
    loops = Counter(tuple(bars[i:i + 4]) for i in range(len(bars) - 3)).most_common(5)
    R["most_common_4bar_loops"] = [{"loop": " | ".join(l), "count": c} for l, c in loops]

    # ---------- structure ----------
    mfcc = librosa.feature.mfcc(y=y, sr=sr, hop_length=hop, n_mfcc=20)
    feat = np.vstack([librosa.util.sync(mfcc, beats, aggregate=np.mean), chroma_sync])
    feat = librosa.util.normalize(feat, axis=0)
    k_seg = 6
    try:
        bounds = librosa.segment.agglomerative(feat, k_seg)
    except Exception:
        bounds = np.linspace(0, feat.shape[1], k_seg + 1).astype(int)[:-1]
    bound_t = list(librosa.frames_to_time(beats[np.clip(bounds, 0, len(beats) - 1)], sr=sr, hop_length=hop)) + [dur]
    # label sections by similarity of mean features
    seg_means = []
    for i in range(len(bound_t) - 1):
        a, b = bounds[i], (bounds[i + 1] if i + 1 < len(bounds) else feat.shape[1])
        seg_means.append(feat[:, a:b].mean(axis=1))
    seg_means = np.array(seg_means)
    labels, letters = [], []
    for i, m in enumerate(seg_means):
        best = None
        for j in range(i):
            d = np.linalg.norm(m - seg_means[j])
            if d < 0.35 and (best is None or d < best[0]):
                best = (d, labels[j])
        lab = best[1] if best else chr(ord("A") + len(set(labels)))
        labels.append(lab)
    R["sections"] = []

    # per-section descriptors
    rms = librosa.feature.rms(y=y, hop_length=hop)[0]
    cent = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=hop)[0]
    bw = librosa.feature.spectral_bandwidth(y=y, sr=sr, hop_length=hop)[0]
    roll = librosa.feature.spectral_rolloff(y=y, sr=sr, hop_length=hop, roll_percent=0.85)[0]
    flat = librosa.feature.spectral_flatness(y=y, hop_length=hop)[0]
    contrast = librosa.feature.spectral_contrast(y=y, sr=sr, hop_length=hop)
    rms_h = librosa.feature.rms(y=y_h, hop_length=hop)[0]
    rms_p = librosa.feature.rms(y=y_p, hop_length=hop)[0]
    onsets_all = librosa.onset.onset_detect(onset_envelope=oenv, sr=sr, hop_length=hop, units="time")
    if y_st.shape[0] == 2:
        L, Rr = y_st
        mid = (L + Rr) / 2; side = (L - Rr) / 2
        rms_mid = librosa.feature.rms(y=mid, hop_length=hop)[0]
        rms_side = librosa.feature.rms(y=side, hop_length=hop)[0]
    else:
        rms_mid = rms_side = None
    ftime = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop)

    def db(x): return 20 * np.log10(x + 1e-9)

    for i in range(len(bound_t) - 1):
        a, b = bound_t[i], bound_t[i + 1]
        m = (ftime >= a) & (ftime < b)
        if m.sum() < 4:
            continue
        sec = {
            "label": labels[i], "start": round(a, 2), "end": round(b, 2), "len_s": round(b - a, 2),
            "bars_approx": round((b - a) / (60 / tempo * 4), 1),
            "loudness_rms_db": round(float(db(rms[m].mean())), 2),
            "loudness_peak_rms_db": round(float(db(rms[m].max())), 2),
            "spectral_centroid_hz": round(float(cent[m].mean()), 0),
            "spectral_bandwidth_hz": round(float(bw[m].mean()), 0),
            "rolloff85_hz": round(float(roll[m].mean()), 0),
            "flatness": round(float(flat[m].mean()), 4),
            "contrast_mean_db": round(float(contrast[:, m].mean()), 2),
            "harmonic_to_percussive_db": round(float(db(rms_h[m].mean()) - db(rms_p[m].mean())), 2),
            "onsets_per_sec": round(float(((onsets_all >= a) & (onsets_all < b)).sum() / (b - a)), 2),
            "key": ks_key(chroma[:, m])[0][0],
        }
        if rms_side is not None:
            sec["stereo_width_side_minus_mid_db"] = round(float(db(rms_side[m].mean()) - db(rms_mid[m].mean())), 2)
        R["sections"].append(sec)

    # ---------- global dynamics ----------
    R["loudness_rms_db_overall"] = round(float(db(np.sqrt(np.mean(y ** 2)))), 2)
    R["peak_dbfs"] = round(float(db(np.abs(y).max())), 2)
    R["crest_factor_db"] = round(R["peak_dbfs"] - R["loudness_rms_db_overall"], 2)
    R["dynamic_range_rms_db_(p95-p5)"] = round(float(db(np.percentile(rms, 95)) - db(np.percentile(rms, 5))), 2)
    R["onsets_per_sec_overall"] = round(float(len(onsets_all) / dur), 2)

    # ---------- melody sketch (harmonic layer) ----------
    try:
        f0, vflag, vprob = librosa.pyin(y_h, fmin=librosa.note_to_hz("C2"), fmax=librosa.note_to_hz("C7"),
                                        sr=sr, hop_length=hop, frame_length=2048)
        f0v = f0[~np.isnan(f0)]
        if len(f0v):
            midi = librosa.hz_to_midi(f0v)
            R["lead_pitch"] = {
                "p10_note": librosa.midi_to_note(int(round(np.percentile(midi, 10)))),
                "median_note": librosa.midi_to_note(int(round(np.median(midi)))),
                "p90_note": librosa.midi_to_note(int(round(np.percentile(midi, 90)))),
                "range_semitones_p10_p90": round(float(np.percentile(midi, 90) - np.percentile(midi, 10)), 1),
                "voiced_fraction": round(float(np.mean(~np.isnan(f0))), 3),
                "pitch_class_histogram": {NOTES[i]: int(c) for i, c in enumerate(np.bincount(np.round(midi).astype(int) % 12, minlength=12))},
                "mean_abs_interval_semitones": round(float(np.mean(np.abs(np.diff(np.round(midi))))), 2),
            }
    except Exception as e:
        R["lead_pitch_error"] = str(e)

    # ---------- plots ----------
    fig, ax = plt.subplots(5, 1, figsize=(14, 18))
    librosa.display.waveshow(y, sr=sr, ax=ax[0], alpha=0.6); ax[0].plot(ftime, rms * (np.abs(y).max() / rms.max()), "r"); ax[0].set_title("waveform + RMS")
    for bt in bound_t[1:-1]: ax[0].axvline(bt, color="k", ls="--")
    S = librosa.amplitude_to_db(np.abs(librosa.stft(y, hop_length=hop)), ref=np.max)
    librosa.display.specshow(S, sr=sr, hop_length=hop, x_axis="time", y_axis="log", ax=ax[1]); ax[1].set_title("spectrogram (dB)")
    librosa.display.specshow(chroma, sr=sr, hop_length=hop, x_axis="time", y_axis="chroma", ax=ax[2]); ax[2].set_title("chromagram")
    librosa.display.specshow(tg, sr=sr, hop_length=hop, x_axis="time", y_axis="tempo", ax=ax[3]); ax[3].axhline(tempo, color="w", ls="--"); ax[3].set_title("tempogram")
    Rm = librosa.segment.recurrence_matrix(feat, mode="affinity", sym=True)
    ax[4].imshow(Rm, cmap="magma", origin="lower"); ax[4].set_title("beat-synchronous self-similarity (structure)")
    plt.tight_layout(); plt.savefig(os.path.join(out, "overview.png"), dpi=110); plt.close()

    # ---------- write ----------
    with open(os.path.join(out, "report.json"), "w") as f:
        json.dump(R, f, indent=2, default=str)
    with open(os.path.join(out, "report.md"), "w") as f:
        f.write(f"# Analysis: {stem}\n\n")
        f.write(f"- duration {R['duration_s']}s, tempo {R['tempo_bpm_global']} bpm (beat-median {R['tempo_bpm_from_beats_median']}), tempo CV {R['tempo_stability_cv']}\n")
        f.write(f"- key {R['key_global']}  (top5: {R['key_global_top5']})\n")
        f.write(f"- swing index {swing}\n- loudness {R['loudness_rms_db_overall']} dB RMS, peak {R['peak_dbfs']} dBFS, crest {R['crest_factor_db']} dB, DR(p95-p5) {R['dynamic_range_rms_db_(p95-p5)']} dB\n")
        f.write(f"- onsets/sec {R['onsets_per_sec_overall']}\n- top chords {R['chord_histogram'][:8]}\n- 4-bar loops {R['most_common_4bar_loops']}\n\n## Sections\n\n")
        f.write("| label | start | end | bars | RMS dB | centroid Hz | H/P dB | onsets/s | key |\n|---|---|---|---|---|---|---|---|---|\n")
        for s in R["sections"]:
            f.write(f"| {s['label']} | {s['start']} | {s['end']} | {s['bars_approx']} | {s['loudness_rms_db']} | {s['spectral_centroid_hz']} | {s['harmonic_to_percussive_db']} | {s['onsets_per_sec']} | {s['key']} |\n")
        if "lead_pitch" in R:
            f.write(f"\n## Lead pitch sketch\n\n{json.dumps(R['lead_pitch'], indent=2)}\n")
    print(json.dumps({k: R[k] for k in ("duration_s", "tempo_bpm_global", "key_global", "crest_factor_db", "onsets_per_sec_overall")}, indent=2))
    print("wrote", out)

if __name__ == "__main__":
    main()
