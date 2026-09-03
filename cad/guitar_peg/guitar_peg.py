"""
Wall peg for a horizontal acoustic-guitar display (no-fastener, 3M Command strips).

Parametric build123d model.  Units: inches.
Origin: centre of the plate's wall-facing surface.  +Z away from the wall, +Y up.

Run:   python guitar_peg.py            -> guitar_peg.step (inch), guitar_peg.stl (mm),
                                          guitar_peg_in.stl (inch), prints sanity checks
"""
from __future__ import annotations

import math
import sys
from pathlib import Path

from build123d import (
    Axis, BuildLine, BuildPart, BuildSketch, Box, Circle, Cylinder,
    GeomType, Location, Locations, Mode, Part, Plane, Polyline, Rectangle, ShapeList,
    Unit, Vector, export_step, export_stl, extrude, fillet, make_face, Align,
)

# --------------------------------------------------------------------------- #
# PARAMETERS (inches)                                                          #
# --------------------------------------------------------------------------- #
PLATE_SIZE      = 6.00    # square plate, W and H
PLATE_THICK     = 0.25
PLATE_CORNER_R  = 0.25    # corner radius in the plate's plane
FRONT_EDGE_R    = 0.03    # small round on the front-face perimeter (wall face stays sharp)

ROD_DIA         = 1.00
BODY_DEPTH      = 4.25    # guitar body depth at lower bout -- set after measuring
LIP_CLEARANCE   = 0.75    # free rod between the guitar's front edge and the lip ramp

RIB_ENABLED     = True
RIB_THICK       = 0.25
RIB_LEN         = 1.50    # along the rod, from the plate face
RIB_HEIGHT      = 1.50    # up the plate face, measured from the rod's top surface
RIB_EDGE_R      = 0.06

# The rib sits ON TOP of the rod for the first RIB_LEN inches, so the guitar's rim
# can only rest on the rod beyond it (the rib doubles as the back-stop).  The rod
# length therefore has to include RIB_LEN or the guitar hangs past the lip.
ROD_LEN         = (RIB_LEN if RIB_ENABLED else 0.0) + BODY_DEPTH + LIP_CLEARANCE
#                 measured from the plate's front face to where the lip ramp leaves
#                 the rod surface (the last point the guitar can rest on).

ROD_TILT_DEG    = 5.0     # rod tip raised above root (tilts up, toward +Y)
ROD_BOTTOM_GAP  = 0.45    # gap between rod's lowest point (at root) and plate's bottom
#                           edge.  Spec said 0.25, but a 0.375 root fillet plus the
#                           front-edge round needs >= ~0.42; see check below.
ROD_END_R       = 0.06    # round on the rod-end / lip-outer-face perimeter

LIP_HEIGHT      = 0.50    # how far the lip rises above the rod's top surface
LIP_THICK       = 0.25    # lip thickness along the rod axis (at the top)
LIP_RAMP_DEG    = 45.0    # underside ramp angle from the rod axis.  The ramp spans the
#                           full lip height, so the lip has no horizontal overhang at
#                           all in the print orientation; the guitar-facing "inner
#                           face" IS this ramp (see README).
LIP_SIDE_INSET  = 0.05    # lip side walls sit this far inside the rod's silhouette so
#                           they meet the rod at a clean angle instead of tangentially
#                           (tangent junctions make knife-edge slivers OCC can't fillet)
LIP_EDGE_R      = 0.10    # round on the lip edges that face the guitar

ROOT_FILLET_R   = 0.375   # fillet where rod meets plate
ROD_INTO_PLATE  = 0.12    # rod extends this far back into the plate (no seam)

# --------------------------------------------------------------------------- #
# Derived                                                                      #
# --------------------------------------------------------------------------- #
R      = ROD_DIA / 2
TILT   = math.radians(ROD_TILT_DEG)
Y0     = -PLATE_SIZE / 2 + ROD_BOTTOM_GAP + R          # rod centreline at the root
AXIS_D = Vector(0, math.sin(TILT), math.cos(TILT))     # rod axis direction (global)
UP_N   = Vector(0, math.cos(TILT), -math.sin(TILT))    # "up" normal to the axis
ROOT   = Vector(0, Y0, PLATE_THICK)                    # axis point on the plate face
ROD_TOTAL = ROD_LEN + LIP_HEIGHT / math.tan(math.radians(LIP_RAMP_DEG)) + LIP_THICK  # axial length past the plate face


def check_parameters() -> None:
    # Root fillet must stay clear of the plate's bottom edge (and its edge round).
    lowest_rod_y = Y0 - R / math.cos(TILT)             # rod's lowest point on the plate face
    theta = math.pi / 2 + TILT                         # dihedral at the rod underside
    fillet_reach = ROOT_FILLET_R / math.tan(theta / 2)
    clearance = (lowest_rod_y - fillet_reach) - (-PLATE_SIZE / 2 + FRONT_EDGE_R)
    if clearance < 0.02:
        sys.exit(
            f"ROOT_FILLET_R={ROOT_FILLET_R} does not fit: it would run off the plate's "
            f"bottom edge by {-clearance:.3f} in.  Raise ROD_BOTTOM_GAP to >= "
            f"{ROD_BOTTOM_GAP - clearance + 0.02:.2f} or lower ROOT_FILLET_R."
        )
    # Rod must not poke through the wall face.
    z_back = PLATE_THICK - ROD_INTO_PLATE * math.cos(TILT) - R * math.sin(TILT)
    assert z_back > 0.02, "rod extension into the plate breaks through the wall face"
    if RIB_ENABLED:
        top_of_rib = Y0 + R / math.cos(TILT) + RIB_HEIGHT
        assert top_of_rib < PLATE_SIZE / 2 - 0.1, "rib runs off the top of the plate"
    assert 30 <= LIP_RAMP_DEG <= 60, 'ramp must stay printable without support'


# --------------------------------------------------------------------------- #
# Model                                                                        #
# --------------------------------------------------------------------------- #
def build_plate() -> Part:
    with BuildPart() as p:
        Box(PLATE_SIZE, PLATE_SIZE, PLATE_THICK, align=(Align.CENTER, Align.CENTER, Align.MIN))
        fillet(p.edges().filter_by(Axis.Z), PLATE_CORNER_R)
        front = p.faces().sort_by(Axis.Z)[-1]
        fillet(front.edges(), FRONT_EDGE_R)          # wall face (z=0) stays sharp
    return p.part


def build_rod_and_lip() -> Part:
    """Rod + lip in the rod's local frame: axis = +Z, lip on +Y, plate face at z=0."""
    z_start = -ROD_INTO_PLATE
    z_end = ROD_TOTAL
    z_ramp = ROD_LEN                    # ramp leaves the rod's top surface here
    half_w = R - LIP_SIDE_INSET

    with BuildPart() as rod:
        Cylinder(R, z_end - z_start, align=(Align.CENTER, Align.CENTER, Align.MIN))
    rod_part = rod.part.moved(Location((0, 0, z_start)))

    # D-shaped lip prism (cross-section = rod's upper semicircle translated up by
    # LIP_HEIGHT, sides vertical down to the rod centreline).  Its walls sit
    # LIP_SIDE_INSET inside the rod so every junction is a clean intersection.
    z_d0 = z_ramp - R - 0.2
    with BuildPart() as dprism:
        with BuildSketch(Plane.XY.offset(z_d0)):
            Rectangle(2 * half_w, LIP_HEIGHT, align=(Align.CENTER, Align.MIN))
            with Locations((0, LIP_HEIGHT)):
                Circle(half_w)
            Rectangle(4 * half_w, 4 * (R + LIP_HEIGHT), align=(Align.CENTER, Align.MIN),
                      mode=Mode.INTERSECT)
        extrude(amount=z_end - z_d0)

    # 45-degree planar ramp under the lip (side profile in the y'z' plane, extruded
    # across x').  It meets the rod's top surface at z_ramp and reaches the lip's top
    # at z_ramp + LIP_HEIGHT, so nothing on the lip overhangs more than 45 degrees.
    k = 1 / math.tan(math.radians(LIP_RAMP_DEG))   # dz per dy along the ramp
    ramp_z0 = z_ramp - R * k                         # ramp line crosses y'=0 here
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

    # Rounds on the lip edges that face the guitar: the crest (ramp/top) and the two
    # ramp/side edges, filleted on the standalone lip (the chain ends inside the rod).
    ramp_face = [f for f in lip.faces().filter_by(GeomType.PLANE)
                 if f.normal_at().Z < -0.5 and f.normal_at().Y > 0.5][0]
    crest_chain = [e for e in ramp_face.edges()
                   if not (e.geom_type == GeomType.LINE and abs(e.center().Y) < 1e-6)]
    lip = try_fillet(lip, crest_chain, LIP_EDGE_R, "lip guitar-facing edges")

    # Rod end / lip outer-face rounds, applied to each body BEFORE the fusion: doing
    # it on the fused perimeter makes OCC build a tiny corner-blend face at the
    # lip-wall/rod kink whose triangulation leaves the STL non-watertight.
    end_face = lip.faces().filter_by(Plane.XY).sort_by(Axis.Z)[-1]
    outer_edges = [e for e in end_face.edges()
                   if not (e.geom_type == GeomType.LINE and abs(e.center().Y) < 1e-6)]
    lip = try_fillet(lip, outer_edges, ROD_END_R, "lip outer-face edges")
    rod_end = rod_part.faces().sort_by(Axis.Z)[-1]
    rod_part = try_fillet(rod_part, rod_end.edges(), ROD_END_R, "rod end edge")

    body = rod_part.fuse(lip).clean()
    # NOTE: the concave crease where the ramp leaves the rod surface (a 135 deg
    # inside corner, not a sharp edge) is left as-is: OCC will not blend it once
    # the end rounds exist, and blending it first forces the non-watertight
    # corner-blend variant.  It is not something the guitar can catch on.
    return body


def try_fillet(body: Part, edges, radius: float, label: str, quiet: bool = False) -> Part:
    """Fillet, falling back to smaller radii; report what happened."""
    r = radius
    if not edges:
        print(f"  -- {label}: no edges selected")
        return body
    while r > radius / (2 if quiet else 8):
        try:
            out = body.fillet(r, list(edges))
            if out.is_valid:
                if abs(r - radius) > 1e-9:
                    print(f"  ! {label}: filleted at R={r:.3f} (requested {radius})")
                else:
                    print(f"  ok {label}: R={r:.3f} on {len(edges)} edges")
                return out
        except Exception as exc:  # noqa: BLE001
            last = exc
        r *= 0.5
    print(f"  {'--' if quiet else '!!'} {label}: skipped (OCC could not build it)")
    return body


def _key(e) -> tuple:
    c = e.center()
    return (round(c.X, 5), round(c.Y, 5), round(c.Z, 5), round(e.length, 5))


def rod_top_point(s: float) -> Vector:
    """Point on the rod's top surface line at axial distance s from the plate face."""
    return ROOT + AXIS_D * s + UP_N * R


def build_rib() -> Part:
    # Where the rod-top line crosses the plate's front face plane:
    s_a = R * math.tan(TILT)
    a = rod_top_point(s_a)                            # rod top at the plate face
    b = Vector(0, a.Y + RIB_HEIGHT, PLATE_THICK)      # top of rib on the plate face
    c = rod_top_point(s_a + RIB_LEN)                  # rib toe on the rod top
    # Buried points so the union has no seams.  The hypotenuse is extended past the
    # toe into the rod so the toe is a clean plane/cylinder intersection (ending it
    # exactly on the rod surface leaves a sliver step that breaks every fillet).
    hyp_dir = (c - b).normalized()
    c_ext = c + hyp_dir * 0.30
    b_in = Vector(0, b.Y, PLATE_THICK - 0.10)
    a_in = Vector(0, a.Y - 0.35, PLATE_THICK - 0.10)
    pts = [(b_in.Y, b_in.Z), (b.Y, b.Z), (c_ext.Y, c_ext.Z), (a_in.Y, a_in.Z)]
    with BuildPart() as rib:
        with BuildSketch(Plane.YZ.offset(-RIB_THICK / 2)) as sk:
            with BuildLine():
                Polyline(*pts, close=True)
            make_face()
        extrude(amount=RIB_THICK)
    return rib.part


def build_peg() -> Part:
    print("building plate")
    plate = build_plate()
    print("building rod + lip")
    rodlip = build_rod_and_lip()
    # local +Z -> AXIS_D (tilt up toward +Y): rotate about X by -tilt, then move to root
    rodlip = rodlip.rotate(Axis.X, -ROD_TILT_DEG).moved(Location(ROOT))
    peg = plate.fuse(rodlip).clean()

    print("root fillet")
    front_z = PLATE_THICK
    root_edges = [
        e for e in peg.edges()
        if abs(e.center().Z - front_z) < 1e-3
        and e.geom_type != GeomType.LINE
        and (e.center() - ROOT).length < R + 0.15
    ]
    peg = try_fillet(peg, root_edges, ROOT_FILLET_R, "root fillet")

    if RIB_ENABLED:
        print("rib")
        rib = build_rib()
        before = {_key(e) for e in peg.edges()}
        peg = peg.fuse(rib).clean()
        # Every edge the union created near the rib: the two convex hypotenuse edges
        # plus the concave junctions with plate, root fillet and rod.  Filleting them
        # in one operation is what makes OCC accept the shared vertices.
        rib_edges = [
            e for e in peg.edges()
            if _key(e) not in before
            and abs(e.center().X) < RIB_THICK / 2 + 0.01
            and e.length < 3.0            # excludes the re-split root-fillet boundary
        ]
        hyp = [e for e in rib_edges if e.geom_type == GeomType.LINE and e.length > RIB_LEN]
        peg = try_fillet(peg, hyp, RIB_EDGE_R, "rib hypotenuse edges")
        # The concave coves where the rib meets plate / root fillet / rod are
        # cosmetic; OCC accepts them only for some parameter sets, so try and move on.
        after = {_key(e) for e in peg.edges()}
        coves = [e for e in peg.edges() if _key(e) not in before and _key(e) in after
                 and abs(e.center().X) < RIB_THICK / 2 + 0.01 and e.length < 3.0
                 and not (e.geom_type == GeomType.LINE and e.length > RIB_LEN)]
        peg = try_fillet(peg, coves, RIB_EDGE_R, "rib junction coves (optional)", quiet=True)
    return peg


# --------------------------------------------------------------------------- #
# Checks + export                                                              #
# --------------------------------------------------------------------------- #
def sanity(peg: Part) -> None:
    bb = peg.bounding_box()
    print("\nSANITY")
    print(f"  solids: {len(peg.solids())}   valid: {peg.is_valid}")
    print(f"  bbox X [{bb.min.X:+.3f}, {bb.max.X:+.3f}]  Y [{bb.min.Y:+.3f}, {bb.max.Y:+.3f}]"
          f"  Z [{bb.min.Z:+.3f}, {bb.max.Z:+.3f}]")
    print(f"  size {bb.size.X:.3f} x {bb.size.Y:.3f} x {bb.size.Z:.3f} in "
          f"(expected Z ~ {PLATE_THICK + ROD_TOTAL:.3f} + tilt)")
    print(f"  volume {peg.volume:.3f} in^3  (~{peg.volume*16.387*1.04:.0f} g solid ABS)")
    # wall face: exactly one planar face at z=0, area == plate outline area
    wall = [f for f in peg.faces() if f.geom_type == GeomType.PLANE
            and abs(f.center().Z) < 1e-6]
    outline_area = PLATE_SIZE ** 2 - (4 - math.pi) * PLATE_CORNER_R ** 2
    print(f"  wall face: {len(wall)} planar face(s) at z=0, area {wall[0].area:.4f} "
          f"(plate outline {outline_area:.4f})")
    nothing_behind = bb.min.Z > -1e-6
    print(f"  nothing behind the wall plane: {nothing_behind}")
    print(f"  rod centreline at root: Y={Y0:+.3f} (plate bottom edge at {-PLATE_SIZE/2:+.2f})")
    print(f"  guitar rests on rod from axial {RIB_LEN if RIB_ENABLED else 0:.2f} to {ROD_LEN:.2f}"
          f" (body depth {BODY_DEPTH} + clearance {LIP_CLEARANCE})")
    assert len(peg.solids()) == 1 and peg.is_valid and len(wall) == 1 and nothing_behind
    assert abs(wall[0].area - outline_area) < 1e-3


def export(peg: Part, out_dir: Path) -> None:
    export_step(peg, str(out_dir / "guitar_peg.step"), unit=Unit.IN)
    export_stl(peg, str(out_dir / "guitar_peg_in.stl"), tolerance=0.001, angular_tolerance=0.1)
    peg_mm = peg.scale(25.4)
    export_stl(peg_mm, str(out_dir / "guitar_peg.stl"), tolerance=0.02, angular_tolerance=0.1)
    print(f"\nexported to {out_dir}: guitar_peg.step (mm-stored, true size), guitar_peg.stl (mm), "
          f"guitar_peg_in.stl (inch)")


if __name__ == "__main__":
    check_parameters()
    peg = build_peg()
    sanity(peg)
    export(peg, Path(__file__).resolve().parent)
