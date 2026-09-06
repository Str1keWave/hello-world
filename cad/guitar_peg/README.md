# Guitar wall peg (Command-strip mount, horizontal display)

Parametric [build123d](https://build123d.readthedocs.io) model of one peg. Print three.

| file | what |
|---|---|
| `guitar_peg.py` | the model; every parameter is at the top of the file |
| `guitar_peg.step` | STEP at true physical size (the file stores mm, as STEP convention has it: 6.000 in = 152.4 mm; any CAD tool will show it in inches on request) |
| `guitar_peg.stl` | STL in **millimetres**, slicer-ready (slicers assume mm) |
| `guitar_peg_in.stl` | same mesh in inches, if you want it to match the STEP numerically |
| `render.py` | shaded renders -> `renders/` |

```
pip install -r requirements.txt
python guitar_peg.py      # rebuild + sanity checks + export (~5 s)
python render.py          # renders (~3 min, pure numpy)
```

Coordinate system: origin at the centre of the wall-facing face, +Z away from the
wall, +Y up (toward the top edge of the plate). Print with the wall face on the bed.

## Where the guitar sits (and why the rod is 6.4 in, not 5.0)

With the rim flat on a rod tilted up 5 deg, the guitar's back leans toward the wall
by 5 deg. Pushed all the way back, the top edge of the body touches the wall, and
that fixes where the rim can be:

| | in |
|---|---|
| top of body leans in by `BODY_HEIGHT * tan(5 deg)` (16 in body) | 1.40 |
| plus back arch, minus plate thickness -> rim back edge off the plate face (`LEAN_OFFSET`) | 1.40 |
| rim front edge (`+ BODY_DEPTH`) | 5.65 |
| lip ramp starts (`+ LIP_CLEARANCE`) = `ROD_LEN` | 6.40 |

A 5.0 in rod would have put the rim's front edge 0.65 in up the lip ramp. tan(5 deg)
is 0.09, far below the friction coefficient of ABS on lacquer, so the guitar does not
creep: it stays wherever it is set between the wall and the lip, and the tilt only
biases it toward the wall. The rim is a 4.25 in flat sitting on the rod, so the
guitar is stable on the three rods alone; the wall is a positional stop, not a
structural one. Everything here is computed from `ROD_TILT_DEG`, `BODY_HEIGHT`,
`BODY_DEPTH`, `BACK_ARCH` and `LIP_CLEARANCE`; change any of them and the rod follows.

Print height in the rod-up orientation is 188 mm. If your printer's Z is shorter,
`ROD_TILT_DEG = 3` brings it to about 168 mm.

## Decisions taken where the spec conflicted with itself

1. **No rib (`RIB_ENABLED = False`).** The gusset would sit on top of the rod for
   the first `RIB_LEN` = 1.5 in, exactly where the guitar's rim rests. At 2 lb the
   1 in ABS rod does not need it (root bending stress is on the order of 60 psi).
   Turning it back on keeps the rim behind it: the rest position becomes
   `max(LEAN_OFFSET, RIB_LEN)` and the rod lengthens if needed.
2. **Rod raised 0.2 in.** A 0.375 root fillet on a rod whose underside is 0.25 in
   from the plate edge runs off the plate. `ROD_BOTTOM_GAP` is 0.45 (the script
   refuses to build if the fillet does not fit). If you would rather keep the rod at
   0.25 from the edge, set `ROD_BOTTOM_GAP = 0.25` and `ROOT_FILLET_R = 0.20`.
3. **The lip has no flat inner face.** A 45 deg underside that spans a 0.5 in tall
   lip *is* the whole guitar-facing surface; any flat vertical inner face above it
   would print as a horizontal overhang. So the stop is a 45 deg ramp rising from
   the rod's top surface to the rounded crest, with a flat outer face flush with
   the rod end. Zero overhang steeper than 45 deg anywhere on the part.
4. **Lip walls are 0.05 in inside the rod's silhouette** (0.90 wide on a 1.00 rod).
   Walls tangent to the rod make knife-edge slivers the kernel cannot fillet.
5. **Rounded vs sharp edges.** Rounded: plate corners (R 0.25), the front-face
   perimeter (R 0.03), the rod/plate root (R 0.375), the rod end and lip outer
   face (R 0.06), the lip crest and ramp side edges (R 0.10), the rib's hypotenuse
   edges (R 0.06, when enabled). Left sharp on purpose: every edge of the wall
   face, so the adhesive area is the full 6 x 6 footprint and there is no rounded
   lip for the strip to peel from. One inside corner is left as a plain crease
   because the kernel would not blend it: the 135 deg cove where the ramp leaves
   the rod. It is not something the guitar can catch on.

## Sanity checks (printed by the script)

- one solid, valid, STL watertight
- bounding box 6.000 x 6.000 x 7.411 in (plate 0.25 + rod 7.15 + tilt)
- wall face: exactly one planar face at Z = 0, area equal to the plate outline
- rod centreline at the root: Y = -2.05 on a plate spanning -3 to +3
- guitar pushed back to the wall: rim spans 1.40 to 5.65 in off the plate face; ramp base at 6.40, crest at 6.90, rod end at 7.15

## Print notes

- ABS, plate face down, no supports. A 6 x 6 ABS plate wants an enclosure and a
  brim; use elephant-foot compensation so the wall face stays flat to the edge.
- ~255 g solid; 4 walls + 30 % infill is plenty. Infill in the plate does not
  matter, walls in the rod root do.
- Put the Command strips near the top of the plate: the 2 lb on the rod turns into
  peel at the top edge and compression at the bottom.
