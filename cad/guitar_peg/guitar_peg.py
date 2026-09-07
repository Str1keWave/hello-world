"""
Wall pegs for a horizontal acoustic-guitar display (no-fastener, 3M Command strips).

Parametric build123d model, two variants from one file:
  body  - the waist peg that carries most of the guitar: tall trapezoid plate,
          rod gusset + horizontal stiffener so the plate acts as a rigid lever
          between the top strip row and the bottom bearing.
  neck  - the two neck pegs: plain 6 x 5 plate, same rod.

Units: inches.  Origin: centre of the plate's wall-facing face, +Z away from the
wall, +Y up.  Print with the wall face on the bed, rod pointing up, no supports.

Run:  python guitar_peg.py            -> builds both variants
      python guitar_peg.py body       -> one variant
"""
from __future__ import annotations

import math
import sys
from pathlib import Path

from build123d import (
    Axis, BuildLine, BuildPart, BuildSketch, Box, Circle, Cylinder, GeomType, Location,
    Locations, Mode, Part, Plane, Polyline, Rectangle, ShapeList, Unit, Vector,
    export_step, export_stl, extrude, fillet, make_face, Align,
)

# --------------------------------------------------------------------------- #
# SHARED PARAMETERS (inches)                                                   #
# --------------------------------------------------------------------------- #
PLATE_THICK     = 0.25
FRONT_EDGE_R    = 0.03    # small round on the front-face perimeter (wall face stays sharp)

ROD_DIA         = 1.00
BODY_DEPTH      = 4.25    # guitar body depth at the lower bout -- set after measuring
BODY_HEIGHT     = 14.0    # tallest point of the body above the rods (top of the lower
#                           bout measured from the waist peg) -- sets the lean offset
BACK_ARCH       = 0.25    # how far the arched back bulges toward the wall past the rim
LIP_CLEARANCE   = 0.75    # free rod between the guitar's front edge and the lip ramp

ROD_TILT_DEG    = 5.0     # rod tip raised above root (tilts up, toward +Y)
ROD_BOTTOM_GAP  = 0.45    # rod's lowest point (at root) to the plate's bottom edge
ROD_END_R       = 0.06
LIP_HEIGHT      = 0.50
LIP_THICK       = 0.25
LIP_RAMP_DEG    = 45.0    # underside ramp: no horizontal overhang anywhere on the lip
LIP_SIDE_INSET  = 0.05
LIP_EDGE_R      = 0.10
ROOT_FILLET_R   = 0.375
ROD_INTO_PLATE  = 0.12

RIB_CLEARANCE   = 0.30    # ribs stay this far clear of the guitar's back (plus BACK_ARCH)
RIB_MIN_DEPTH   = 0.30    # the rod rib stops where the clearance envelope gets this thin
RIB_EDGE_R      = 0.06
STRIP_LEN       = 3.60    # 3M Large picture-hanging strip, for the strip-row band height

# --------------------------------------------------------------------------- #
# VARIANTS                                                                     #
# --------------------------------------------------------------------------- #
PRESETS = {
    "body": dict(
        PLATE_H=9.5, PLATE_W_TOP=8.5, PLATE_W_BOT=4.0,
        PLATE_CORNER_R_TOP=0.75, PLATE_CORNER_R_BOT=0.5,
        RIB_ENABLED=True,  RIB_THICK=0.50,          # vertical gusset up the plate
        HRIB_ENABLED=True, HRIB_THICK=0.50, HRIB_END_MARGIN=0.6,   # under the strip row
    ),
    "neck": dict(
        PLATE_H=5.0, PLATE_W_TOP=6.0, PLATE_W_BOT=6.0,
        PLATE_CORNER_R_TOP=0.25, PLATE_CORNER_R_BOT=0.25,
        RIB_ENABLED=False, RIB_THICK=0.5,
        HRIB_ENABLED=False, HRIB_THICK=0.5, HRIB_END_MARGIN=0.6,
    ),
}


def configure(variant: str) -> None:
    """Load a preset and recompute everything derived from the parameters."""
    g = globals()
    g.update(PRESETS[variant])
    g["VARIANT"] = variant
    g["R"] = ROD_DIA / 2
    g["TILT"] = math.radians(ROD_TILT_DEG)
    g["Y0"] = -PLATE_H / 2 + ROD_BOTTOM_GAP + R                # rod centreline at the root
    g["AXIS_D"] = Vector(0, math.sin(TILT), math.cos(TILT))    # rod axis (global)
    g["UP_N"] = Vector(0, math.cos(TILT), -math.sin(TILT))     # "up" normal to the axis
    g["ROOT"] = Vector(0, Y0, PLATE_THICK)
    # Where the guitar sits: rim flat on a rod tilted TILT means the back leans toward
    # the wall by TILT; pushed back until the top of the body touches the wall, the
    # rim's back edge is LEAN_OFFSET in front of the plate face.  tan(5 deg) = 0.09 is
    # far below friction, so it stays wherever it is put between there and the lip.
    g["LEAN_OFFSET"] = max(0.0, BODY_HEIGHT * math.tan(TILT) + BACK_ARCH - PLATE_THICK)
    g["ROD_LEN"] = LEAN_OFFSET + BODY_DEPTH + LIP_CLEARANCE      # plate face -> lip ramp base
    g["ROD_TOTAL"] = ROD_LEN + LIP_HEIGHT / math.tan(math.radians(LIP_RAMP_DEG)) + LIP_THICK
    # Rib envelope: the guitar's back plane, minus arch and clearance, as a function of
    # height h above the rod's top surface.  Ribs live inside this.
    g["RIB_DEPTH0"] = LEAN_OFFSET - BACK_ARCH - RIB_CLEARANCE     # depth at the rod top
    g["ROD_TOP_Y"] = Y0 + R / math.cos(TILT)                      # rod top on the plate face
    # Strip row: Large strips flush to the top edge; the horizontal rib sits just under it.
    g["STRIP_ROW_BOTTOM_Y"] = PLATE_H / 2 - STRIP_LEN - 0.15
    if RIB_ENABLED:
        h_env = (RIB_DEPTH0 - RIB_MIN_DEPTH) / math.tan(TILT)
        h_plate = PLATE_H / 2 - ROD_TOP_Y - 0.75
        h = min(h_env, h_plate)
        if HRIB_ENABLED:
            # run through the horizontal rib and a little past it: a clean crossing, not
            # two faces a hair apart (which makes slivers OCC cannot fillet)
            h = max(h, STRIP_ROW_BOTTOM_Y + 0.35 - ROD_TOP_Y)
        g["RIB_HEIGHT"] = h
    else:
        g["RIB_HEIGHT"] = 0.0


def rib_depth(h: float) -> float:
    return RIB_DEPTH0 - h * math.tan(TILT)


def plate_half_width(y: float) -> float:
    t = (y + PLATE_H / 2) / PLATE_H
    return (PLATE_W_BOT + (PLATE_W_TOP - PLATE_W_BOT) * t) / 2


def check_parameters() -> None:
    lowest_rod_y = Y0 - R / math.cos(TILT)
    theta = math.pi / 2 + TILT
    fillet_reach = ROOT_FILLET_R / math.tan(theta / 2)
    clearance = (lowest_rod_y - fillet_reach) - (-PLATE_H / 2 + FRONT_EDGE_R)
    if clearance < 0.02:
        sys.exit(f"ROOT_FILLET_R does not fit above the plate's bottom edge (short by "
                 f"{-clearance:.3f} in): raise ROD_BOTTOM_GAP or lower ROOT_FILLET_R")
    z_back = PLATE_THICK - ROD_INTO_PLATE * math.cos(TILT) - R * math.sin(TILT)
    assert z_back > 0.02, "rod extension into the plate breaks through the wall face"
    assert plate_half_width(Y0) > R + ROOT_FILLET_R + 0.3, "plate too narrow at the rod root"
    assert 30 <= LIP_RAMP_DEG <= 60
    if RIB_ENABLED:
        assert RIB_DEPTH0 > RIB_MIN_DEPTH + 0.1, "no room for a rib inside the lean envelope"
        assert RIB_HEIGHT > 1.0 and rib_depth(RIB_HEIGHT) > 0.2, "rod rib runs out of clearance"


# --------------------------------------------------------------------------- #
# Model                                                                        #
# --------------------------------------------------------------------------- #
def build_plate() -> Part:
    hb, ht, H = PLATE_W_BOT / 2, PLATE_W_TOP / 2, PLATE_H / 2
    with BuildPart() as p:
        with BuildSketch() as sk:
            with BuildLine():
                Polyline((-hb, -H), (hb, -H), (ht, H), (-ht, H), close=True)
            make_face()
            fillet(sk.vertices().filter_by_position(Axis.Y, H - 0.01, H + 0.01), PLATE_CORNER_R_TOP)
            fillet(sk.vertices().filter_by_position(Axis.Y, -H - 0.01, -H + 0.01), PLATE_CORNER_R_BOT)
        extrude(amount=PLATE_THICK)
        front = p.faces().sort_by(Axis.Z)[-1]
        fillet(front.edges(), FRONT_EDGE_R)          # wall face (z=0) stays sharp
    return p.part


def build_rod_and_lip() -> Part:
    """Rod + lip in the rod's local frame: axis = +Z, lip on +Y, plate face at z=0."""
    z_start, z_end, z_ramp = -ROD_INTO_PLATE, ROD_TOTAL, ROD_LEN
    half_w = R - LIP_SIDE_INSET
    with BuildPart() as rod:
        Cylinder(R, z_end - z_start, align=(Align.CENTER, Align.CENTER, Align.MIN))
    rod_part = rod.part.moved(Location((0, 0, z_start)))

    z_d0 = z_ramp - R - 0.2
    with BuildPart() as dprism:
        with BuildSketch(Plane.XY.offset(z_d0)):
            Rectangle(2 * half_w, LIP_HEIGHT, align=(Align.CENTER, Align.MIN))
            with Locations((0, LIP_HEIGHT)):
                Circle(half_w)
            Rectangle(4 * half_w, 4 * (R + LIP_HEIGHT), align=(Align.CENTER, Align.MIN),
                      mode=Mode.INTERSECT)
        extrude(amount=z_end - z_d0)

    k = 1 / math.tan(math.radians(LIP_RAMP_DEG))
    ramp_z0 = z_ramp - R * k
    y_top = R + LIP_HEIGHT + 0.2
    pts = [(-0.3, ramp_z0 - 0.3 * k), (y_top, ramp_z0 + y_top * k), (y_top, z_end), (-0.3, z_end)]
    with BuildPart() as rampp:
        with BuildSketch(Plane.YZ.offset(-half_w - 0.1)):
            with BuildLine():
                Polyline(*pts, close=True)
            make_face()
        extrude(amount=2 * half_w + 0.2)

    lip = dprism.part.intersect(rampp.part)
    if isinstance(lip, ShapeList):
        lip = Part(lip)
    ramp_face = [f for f in lip.faces().filter_by(GeomType.PLANE)
                 if f.normal_at().Z < -0.5 and f.normal_at().Y > 0.5][0]
    crest_chain = [e for e in ramp_face.edges()
                   if not (e.geom_type == GeomType.LINE and abs(e.center().Y) < 1e-6)]
    lip = try_fillet(lip, crest_chain, LIP_EDGE_R, "lip guitar-facing edges")
    end_face = lip.faces().filter_by(Plane.XY).sort_by(Axis.Z)[-1]
    outer_edges = [e for e in end_face.edges()
                   if not (e.geom_type == GeomType.LINE and abs(e.center().Y) < 1e-6)]
    lip = try_fillet(lip, outer_edges, ROD_END_R, "lip outer-face edges")
    rod_part = try_fillet(rod_part, rod_part.faces().sort_by(Axis.Z)[-1].edges(), ROD_END_R,
                          "rod end edge")
    return rod_part.fuse(lip).clean()


def try_fillet(body: Part, edges, radius: float, label: str, quiet: bool = False) -> Part:
    if not edges:
        print(f"  -- {label}: no edges selected")
        return body
    r = radius
    while r > radius / (2 if quiet else 8):
        try:
            out = body.fillet(r, list(edges))
            if out.is_valid:
                note = "" if abs(r - radius) < 1e-9 else f" (requested {radius})"
                print(f"  ok {label}: R={r:.3f} on {len(edges)} edges{note}")
                return out
        except Exception:  # noqa: BLE001
            pass
        r *= 0.5
    print(f"  {'--' if quiet else '!!'} {label}: skipped (OCC could not build it)")
    return body


def _key(e) -> tuple:
    c = e.center()
    return (round(c.X, 5), round(c.Y, 5), round(c.Z, 5), round(e.length, 5))


def build_rod_rib() -> Part:
    """Vertical gusset in the plane X=0.  Its outer edge is parallel to the guitar's
    leaned back, RIB_CLEARANCE + BACK_ARCH behind it, so it uses all the room there is."""
    y_a = ROD_TOP_Y
    d0, dt = rib_depth(0.0), rib_depth(RIB_HEIGHT)
    y_t = y_a + RIB_HEIGHT
    slope = math.tan(TILT)                              # dz per unit y along the envelope
    # buried points: the envelope line is extended 0.3 into the rod so the toe is a clean
    # plane/cylinder intersection; the back edge is buried in the plate.
    y_b = y_a - 0.3
    pts = [(y_t, PLATE_THICK - 0.10), (y_t, PLATE_THICK + dt),
           (y_b, PLATE_THICK + d0 + 0.3 * slope), (y_b - 0.2, PLATE_THICK - 0.10)]
    with BuildPart() as rib:
        with BuildSketch(Plane.YZ.offset(-RIB_THICK / 2)):
            with BuildLine():
                Polyline(*pts, close=True)
            make_face()
        extrude(amount=RIB_THICK)
    return rib.part


def build_hrib() -> Part:
    """Horizontal stiffener just below the strip row, so all the top strips share the
    tension instead of only the ones within an inch of the rod rib.  Rounded here, as a
    standalone box, because rounding it after the union makes OCC build corner blends
    whose triangulation leaves the STL open."""
    y_c = STRIP_ROW_BOTTOM_Y - HRIB_THICK / 2
    h_top = STRIP_ROW_BOTTOM_Y - ROD_TOP_Y
    depth = rib_depth(h_top) - 0.05                     # a clean step below the rod rib
    half_len = plate_half_width(y_c) - HRIB_END_MARGIN
    with BuildPart() as hr:
        with Locations((0, y_c, PLATE_THICK - 0.10)):
            Box(2 * half_len, HRIB_THICK, depth + 0.10, align=(Align.CENTER, Align.CENTER, Align.MIN))
        # top-face loop only: adding the vertical end edges makes three rounds meet at a
        # corner, and OCC's spherical corner patch meshes with open edges
        fillet(hr.faces().sort_by(Axis.Z)[-1].edges(), RIB_EDGE_R)
    return hr.part


def build_peg() -> Part:
    print(f"[{VARIANT}] plate")
    plate = build_plate()
    print(f"[{VARIANT}] rod + lip")
    rodlip = build_rod_and_lip().rotate(Axis.X, -ROD_TILT_DEG).moved(Location(ROOT))
    peg = plate.fuse(rodlip).clean()

    print(f"[{VARIANT}] root fillet")
    root_edges = [e for e in peg.edges()
                  if abs(e.center().Z - PLATE_THICK) < 1e-3 and e.geom_type != GeomType.LINE
                  and (e.center() - ROOT).length < R + 0.15]
    peg = try_fillet(peg, root_edges, ROOT_FILLET_R, "root fillet")

    if RIB_ENABLED:
        print(f"[{VARIANT}] rod rib  (depth {rib_depth(0):.2f} -> {rib_depth(RIB_HEIGHT):.2f} in "
              f"over {RIB_HEIGHT:.2f} in, {RIB_THICK} thick)")
        before = {_key(e) for e in peg.edges()}
        peg = peg.fuse(build_rod_rib()).clean()
        new = [e for e in peg.edges() if _key(e) not in before
               and abs(e.center().X) < RIB_THICK / 2 + 0.01 and e.length < 3.0 * max(1, RIB_HEIGHT)]
        # convex edges: the two long envelope edges and the end face's edges.  The lines
        # parallel to the rod axis (rib wall meeting the rod) are concave coves, not these.
        convex = [e for e in new if e.geom_type == GeomType.LINE and e.center().Z > PLATE_THICK + 0.05
                  and abs((e @ 1 - e @ 0).normalized().dot(AXIS_D)) < 0.99]
        peg = try_fillet(peg, convex, RIB_EDGE_R, "rod rib outer edges")
        coves = [e for e in peg.edges() if _key(e) not in before and e not in convex
                 and abs(e.center().X) < RIB_THICK / 2 + 0.01 and e.length < 3.0 * max(1, RIB_HEIGHT)]
        peg = try_fillet(peg, coves, RIB_EDGE_R, "rod rib junction coves (optional)", quiet=True)

    if HRIB_ENABLED:
        print(f"[{VARIANT}] horizontal rib under the strip row")
        before = {_key(e) for e in peg.edges()}
        hr = build_hrib()
        peg = peg.fuse(hr).clean()
        bb = hr.bounding_box()
        coves = [e for e in peg.edges() if _key(e) not in before
                 and bb.min.Y - 0.01 <= e.center().Y <= bb.max.Y + 0.01
                 and e.center().Z > PLATE_THICK + 0.05 and e.geom_type == GeomType.LINE]
        peg = try_fillet(peg, coves, RIB_EDGE_R, "rib crossing coves (optional)", quiet=True)
    return peg


# --------------------------------------------------------------------------- #
# Checks + export                                                              #
# --------------------------------------------------------------------------- #
def sanity(peg: Part) -> None:
    bb = peg.bounding_box()
    print(f"\nSANITY [{VARIANT}]")
    print(f"  solids: {len(peg.solids())}   valid: {peg.is_valid}")
    print(f"  size {bb.size.X:.3f} x {bb.size.Y:.3f} x {bb.size.Z:.3f} in  "
          f"({bb.size.X*25.4:.0f} x {bb.size.Y*25.4:.0f} mm footprint, {bb.size.Z*25.4:.0f} mm tall)")
    print(f"  volume {peg.volume:.2f} in^3  (~{peg.volume*16.387*1.07:.0f} g solid ASA)")
    wall = [f for f in peg.faces() if f.geom_type == GeomType.PLANE and abs(f.center().Z) < 1e-6]
    outline_area = build_plate().faces().sort_by(Axis.Z)[0].area
    print(f"  wall face: {len(wall)} planar face(s) at z=0, area {wall[0].area:.3f} "
          f"(plate outline {outline_area:.3f}); nothing behind the wall plane: {bb.min.Z > -1e-6}")
    print(f"  rod centreline at root: Y={Y0:+.3f} (plate spans {-PLATE_H/2:+.2f}..{PLATE_H/2:+.2f})")
    print(f"  guitar pushed back to the wall: rim spans {LEAN_OFFSET:.2f}..{LEAN_OFFSET+BODY_DEPTH:.2f} "
          f"off the plate face; lip ramp starts at {ROD_LEN:.2f}")
    if RIB_ENABLED:
        print(f"  rod rib: {rib_depth(0):.2f} in deep at the rod, {rib_depth(RIB_HEIGHT):.2f} at "
              f"{RIB_HEIGHT:.2f} in up; {RIB_CLEARANCE} in clear of the back plus {BACK_ARCH} arch")
    print(f"  strip row: Large strips from Y={STRIP_ROW_BOTTOM_Y:+.2f} to the top edge; "
          f"plate is {2*plate_half_width(STRIP_ROW_BOTTOM_Y):.1f} in wide there "
          f"-> {int(2*plate_half_width(STRIP_ROW_BOTTOM_Y) // 0.95)} strips")
    assert len(peg.solids()) == 1 and peg.is_valid and len(wall) == 1 and bb.min.Z > -1e-6
    assert abs(wall[0].area - outline_area) < 1e-3


def export(peg: Part, out_dir: Path) -> None:
    stem = f"guitar_peg_{VARIANT}"
    export_step(peg, str(out_dir / f"{stem}.step"), unit=Unit.IN)
    export_stl(peg.scale(25.4), str(out_dir / f"{stem}.stl"), tolerance=0.02, angular_tolerance=0.1)
    print(f"  exported {stem}.step (true size) and {stem}.stl (mm)")


if __name__ == "__main__":
    variants = sys.argv[1:] or ["body", "neck"]
    for v in variants:
        configure(v)
        check_parameters()
        peg = build_peg()
        sanity(peg)
        export(peg, Path(__file__).resolve().parent)
        print()
