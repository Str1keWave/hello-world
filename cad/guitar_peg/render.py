"""
Shaded renders of guitar_peg_in.stl -> renders/*.png (no GPU needed: tiny numpy
z-buffer rasteriser with Phong-ish shading and silhouette/crease lines).

Run after guitar_peg.py:   python render.py
"""
from __future__ import annotations

import math
from pathlib import Path

import numpy as np
import trimesh
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
OUT = HERE / "renders"
SS = 2                      # supersampling factor
SIZE = 1100                 # output image size (square)
BODY = np.array([0.86, 0.86, 0.84])        # light ABS grey
BG_TOP, BG_BOT = np.array([0.97, 0.97, 0.98]), np.array([0.84, 0.85, 0.88])


def look(direction, up=(0, 1, 0)):
    """Camera basis (right, up, back) for an orthographic view looking along `direction`."""
    d = np.asarray(direction, float); d /= np.linalg.norm(d)
    u = np.asarray(up, float)
    r = np.cross(d, u); r /= np.linalg.norm(r)
    u = np.cross(r, d); u /= np.linalg.norm(u)
    return r, u, -d


def render(mesh: trimesh.Trimesh, direction, up=(0, 1, 0), zoom=1.0, center=None,
           lights=((( -0.5, 0.8, 0.9), 0.75), ((0.8, 0.3, -0.4), 0.30)), ambient=0.28):
    r, u, b = look(direction, up)
    V = mesh.vertices
    if center is None:
        center = (mesh.bounds[0] + mesh.bounds[1]) / 2
    P = V - center
    x, y, depth = P @ r, P @ u, P @ b
    extent = max(np.ptp(x), np.ptp(y)) / zoom * 1.12
    W = H = SIZE * SS
    scale = W / extent
    px = (x * scale + W / 2)
    py = (H / 2 - y * scale)
    F = mesh.faces
    vn = mesh.vertex_normals
    fn = mesh.face_normals
    zbuf = np.full((H, W), -np.inf)
    nbuf = np.zeros((H, W, 3))
    hit = np.zeros((H, W), bool)
    # back-face cull: faces pointing away from camera (dot with -b < 0)
    front = (fn @ b) > -0.05
    for fi in np.nonzero(front)[0]:
        i0, i1, i2 = F[fi]
        xs = np.array([px[i0], px[i1], px[i2]]); ys = np.array([py[i0], py[i1], py[i2]])
        x0, x1 = int(max(np.floor(xs.min()), 0)), int(min(np.ceil(xs.max()), W - 1))
        y0, y1 = int(max(np.floor(ys.min()), 0)), int(min(np.ceil(ys.max()), H - 1))
        if x1 < x0 or y1 < y0:
            continue
        gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
        det = (xs[1] - xs[0]) * (ys[2] - ys[0]) - (xs[2] - xs[0]) * (ys[1] - ys[0])
        if abs(det) < 1e-12:
            continue
        w0 = ((xs[1] - gx) * (ys[2] - gy) - (xs[2] - gx) * (ys[1] - gy)) / det
        w1 = ((xs[2] - gx) * (ys[0] - gy) - (xs[0] - gx) * (ys[2] - gy)) / det
        w2 = 1 - w0 - w1
        inside = (w0 >= -1e-9) & (w1 >= -1e-9) & (w2 >= -1e-9)
        if not inside.any():
            continue
        z = w0 * depth[i0] + w1 * depth[i1] + w2 * depth[i2]
        sub = zbuf[y0:y1 + 1, x0:x1 + 1]
        upd = inside & (z > sub)
        if not upd.any():
            continue
        sub[upd] = z[upd]
        n = (w0[..., None] * vn[i0] + w1[..., None] * vn[i1] + w2[..., None] * vn[i2])
        nsub = nbuf[y0:y1 + 1, x0:x1 + 1]
        nsub[upd] = n[upd]
        hit[y0:y1 + 1, x0:x1 + 1] |= upd
    # shading
    n = nbuf / np.maximum(np.linalg.norm(nbuf, axis=2, keepdims=True), 1e-9)
    shade = np.full((H, W), ambient)
    spec = np.zeros((H, W))
    view = b
    for ldir, li in lights:
        L = np.asarray(ldir, float); L /= np.linalg.norm(L)
        ndl = np.clip(n @ L, 0, None)
        shade += li * ndl
        hvec = L + view; hvec /= np.linalg.norm(hvec)
        spec += 0.18 * li * np.clip(n @ hvec, 0, None) ** 40
    col = BODY[None, None, :] * np.clip(shade, 0, 1.15)[..., None] + spec[..., None]
    # background gradient
    t = np.linspace(0, 1, H)[:, None, None]
    bg = BG_TOP * (1 - t) + BG_BOT * t
    img = np.where(hit[..., None], col, np.broadcast_to(bg, (H, W, 3)))
    # crease + silhouette lines from normal/depth discontinuities
    zf = np.where(hit, zbuf, np.nan)
    dz = np.zeros((H, W), bool)
    for ax in (0, 1):
        d = np.abs(np.diff(zf, axis=ax))
        m = d > extent * 0.015
        m = np.nan_to_num(m, nan=False)
        if ax == 0:
            dz[1:, :] |= m
        else:
            dz[:, 1:] |= m
    sil = hit ^ np.roll(hit, 1, 0) | hit ^ np.roll(hit, 1, 1)
    dn = np.zeros((H, W), bool)
    for ax in (0, 1):
        d = 1 - np.sum(n * np.roll(n, 1, axis=ax), axis=2)
        dn |= (d > 0.35) & hit & np.roll(hit, 1, axis=ax)
    lines = (dz | sil | dn) & hit
    img[lines] = img[lines] * 0.45
    # soft ground shadow-ish vignette omitted; downsample for AA
    out = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8))
    out = out.resize((SIZE, SIZE), Image.LANCZOS)
    return out


def label(img: Image.Image, text: str) -> Image.Image:
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 28)
    except OSError:
        font = ImageFont.load_default()
    d.rectangle([0, SIZE - 52, SIZE, SIZE], fill=(40, 40, 46))
    d.text((18, SIZE - 42), text, fill=(240, 240, 240), font=font)
    return img


def main() -> None:
    import sys
    variant = sys.argv[1] if len(sys.argv) > 1 else "body"
    OUT.mkdir(exist_ok=True)
    m = trimesh.load(HERE / f"guitar_peg_{variant}.stl")
    m.merge_vertices()
    if m.bounds[1][2] - m.bounds[0][2] > 50:      # mm file -> inches for the labels/zooms
        m.apply_scale(1 / 25.4)
    # smooth normals only across edges flatter than 25 deg; sharp creases stay sharp
    m = trimesh.graph.smooth_shade(m, angle=math.radians(25))
    bb = m.bounds
    views = {
        # name: (direction camera looks along, up vector, zoom, caption)
        "01_iso_front":   ((-0.55, -0.45, -0.70), (0, 1, 0), 1.0,
                           "Front iso: plate, tilted rod, lip ramp"),
        "02_iso_front_low": ((0.60, 0.30, -0.74), (0, 1, 0), 1.0,
                           "Front iso from below: rod sits low on the plate"),
        "03_side":        ((-1.0, 0.0, 0.0), (0, 1, 0), 1.0,
                           "Side profile: 5 deg tilt, 45 deg lip ramp"),
        "04_top":         ((0.0, -1.0, 0.0), (0, 0, -1), 1.0,
                           "Top: rod on the plate centreline, ribs, D-lip at the tip"),
        "05_back_wall_face": ((0.0, 0.0, 1.0), (0, 1, 0), 1.0,
                           "Wall face: one flat featureless plane"),
        "06_print_orientation": ((-0.55, -0.70, -0.45), (0, 0, 1), 1.0,
                           "Print orientation: plate on bed, rod up, no overhang > 45 deg"),
    }
    imgs = []
    for name, (d, up, zoom, cap) in views.items():
        img = render(m, d, up, zoom)
        img = label(img, cap)
        img.save(OUT / f"{variant}_{name}.png")
        imgs.append(img)
        print("rendered", name)
    # lip close-up
    tip = m.vertices[m.vertices[:, 2] > bb[1][2] - 1.6]
    c = (tip.min(0) + tip.max(0)) / 2
    img = render(m, (-0.6, -0.5, -0.62), (0, 1, 0), zoom=4.2, center=c)
    img = label(img, "Lip detail: D-shaped stop, 45 deg underside, rounded crest")
    img.save(OUT / f"{variant}_07_lip_detail.png"); imgs.append(img); print("rendered 07_lip_detail")
    # root / rib close-up
    c = np.array([0.0, bb[0][1] + 1.6, 0.9])
    img = render(m, (0.7, -0.35, -0.62), (0, 1, 0), zoom=2.2, center=c)
    img = label(img, "Root detail: 0.375 fillet, rod rib" if variant == "body" else "Root detail: 0.375 fillet, rounded plate edge")
    img.save(OUT / f"{variant}_08_root_detail.png"); imgs.append(img); print("rendered 08_root_detail")
    # contact sheet
    cols = 4
    rows = math.ceil(len(imgs) / cols)
    th = 520
    sheet = Image.new("RGB", (cols * th, rows * th), (255, 255, 255))
    for i, im in enumerate(imgs):
        sheet.paste(im.resize((th, th), Image.LANCZOS), ((i % cols) * th, (i // cols) * th))
    sheet.save(OUT / f"{variant}_00_contact_sheet.png")
    print("wrote contact sheet")


if __name__ == "__main__":
    main()
