# Guitar wall pegs (Command-strip mount, horizontal display)

Parametric [build123d](https://build123d.readthedocs.io) model, two variants from one
file. One guitar = one body peg + two neck pegs.

| file | what |
|---|---|
| `guitar_peg.py` | the model; parameters and the two presets are at the top |
| `guitar_peg_body.step` / `.stl` | **body (waist) peg**: 9.5 in tall trapezoid plate, rod gusset, horizontal stiffener |
| `guitar_peg_neck.step` / `.stl` | **neck peg**: 6 x 5 in plate, same rod |
| `render.py` | shaded renders -> `renders/{body,neck}_*.png` |
| `peg_layout.py` | plan view of where the three pegs sit under a dreadnought |

STEP files are true size (stored in mm, as STEP convention has it; 9.5 in = 241.3 mm).
STL files are in mm and slicer-ready.

```
pip install -r requirements.txt
python guitar_peg.py          # builds both variants, prints sanity checks
python guitar_peg.py body     # one variant
python render.py body         # renders (~3 min each, pure numpy)
```

Coordinates: origin at the centre of the wall-facing face, +Z away from the wall, +Y
up. Print with the wall face on the bed, rod pointing up. No supports anywhere.

## Where the guitar sits

With the rim flat on a rod tilted up 5 deg, the back leans toward the wall by 5 deg.
Pushed all the way back, the top of the body touches the wall, which puts the rim's
back edge `LEAN_OFFSET` in front of the plate face:

| | in |
|---|---|
| `BODY_HEIGHT` (top of lower bout above the waist rod) x tan 5 deg + back arch - plate | 1.22 |
| rim front edge (`+ BODY_DEPTH`) | 5.47 |
| lip ramp starts (`+ LIP_CLEARANCE`) = `ROD_LEN` | 6.22 |

tan 5 deg = 0.09 is far below friction, so the guitar stays wherever it is put between
the wall and the lip. All three pegs share the same rod, because the guitar is rigid.

## Why the body plate looks the way it does

The body peg carries 3.6 to 4 lb (the neck pegs share the rest). Its plate's job is
to turn the rod's moment, about 19 in-lb, into tension in the top strips and
compression at the bottom edge with as long a lever arm as possible.

- **9.5 in tall.** Couple arm ~7 in versus ~4.3 on a 6 in plate: top-strip tension
  drops from ~0.75 to ~0.4 lb per strip. Hidden behind the body (the waist is ~10.9
  in wide).
- **Trapezoid, 4 in at the rod flaring to 8.5 in at the top.** Width at the strip row
  is what counts (7 Large strips fit there). Width at the rod would show below the
  body's edge and does nothing, so it is only as wide as the root fillet needs.
- **Rod rib (0.5 thick, 0.67 in deep at the rod).** A 1/4 in plastic plate on foam
  tape is a *flexible* beam: beam-on-elastic-foundation math gives a characteristic
  length of about an inch, so without stiffening the moment would dump into whatever
  strips are nearest the rod. The rib makes the plate act as the rigid lever the
  strip layout assumes. It also roughly triples the rod's root section on the
  tension side. Its outer edge is parallel to the guitar's leaned back, 0.3 in clear
  of it plus 0.25 in for the back's arch, so it uses all the room there is.
- **Horizontal rib under the strip row.** Same reasoning across the width: without it
  only the 3 or 4 strips nearest the rod rib would carry tension. With it all 7 share.
- **Corner radii 0.75 top / 0.5 bottom.** Big ASA plates lift at sharp corners, and
  the top corners are exactly where the strips are.

Rib and plate stresses are all below 200 psi. The ribs are stiffness members, not
strength members; 3 to 4 walls with sparse infill is fine.

## Strip layout (Large picture-hanging strips, ~3/4 x 3-1/2 in)

Same rule for both pegs: **strips at the top edge and the bottom edge, none in between.**
Strips near the rod on the tension side would peel first with a short lever arm.

- Body peg: 7 strips vertical across the top row, tops flush to the top edge. One or
  two horizontal strips across the bottom 1.5 in as the compression bearing.
- Neck pegs: 6 across the top, one horizontal at the bottom.
- Clean wall and plate with isopropyl, press each wall half 30 s, wait 24 h before
  loading. Install the body peg first, then the headstock-end neck peg touching the
  neck, then the heel neck peg with a card gap (it is a guard, not a carrier).

## Other decisions

- **Rod raised to 0.45 in from the bottom edge** so the 0.375 root fillet fits.
- **The lip has no flat inner face.** Its guitar-facing surface is a 45 deg ramp from
  the rod's top to the rounded crest, so nothing on the lip overhangs past 45 deg.
- **Lip walls sit 0.05 in inside the rod's silhouette** so every junction is a clean
  intersection the kernel can fillet.
- **Edges:** rounded everywhere the hand or the guitar meets the part. Every edge of
  the wall face is sharp so the strips get the whole footprint. Two inside coves are
  left as creases because the kernel would not blend them: the ramp base on the rod
  and the rib-to-plate junctions.

## Print notes

- ASA, plate face down, no supports, 0.28 mm layers is fine. Enclosure closed, brim,
  elephant-foot compensation so the wall face stays flat to the edge.
- 10% infill, 3 walls (4 on the body peg if you like). Walls carry everything here.
- Body peg footprint 206 x 241 mm, height 184 mm. Check flatness of the wall face
  after printing; a corner lifted more than ~0.5 mm will not let its strip seat.
