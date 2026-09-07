"""Wall-face view of both plates with the Command-strip placement drawn to scale."""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Circle, FancyBboxPatch, Polygon
import numpy as np

STRIP_W, STRIP_L = 0.75, 3.6          # 3M Large picture-hanging strip
EDGE = 0.15                            # margin from any plate edge

def trapezoid(ax, wb, wt, H, r_top, r_bot):
    # rounded trapezoid outline via polygon with many points on the arcs (good enough to look at)
    pts = []
    def arc(cx, cy, r, a0, a1):
        for a in np.linspace(a0, a1, 12):
            pts.append((cx + r*np.cos(a), cy + r*np.sin(a)))
    slope_x = (wt - wb) / 2 / H
    ang = np.arctan(slope_x)
    # bottom-left corner, bottom-right, top-right, top-left (approximate tangent points)
    arc(-wb/2 + r_bot, r_bot, r_bot, np.pi, 1.5*np.pi)
    arc( wb/2 - r_bot, r_bot, r_bot, 1.5*np.pi, 2*np.pi + ang)
    arc( wt/2 - r_top, H - r_top, r_top, ang, 0.5*np.pi)
    arc(-wt/2 + r_top, H - r_top, r_top, 0.5*np.pi, np.pi - ang)
    ax.add_patch(Polygon(pts, closed=True, facecolor="#e9e6df", edgecolor="#444", lw=1.5, zorder=1))
    return lambda y: (wb + (wt - wb) * y / H) / 2

def strips_top_row(ax, half_w_at, H, n, color):
    y0 = H - EDGE - STRIP_L
    hw = half_w_at(y0) - EDGE - 0.1       # narrowest point of the row is its bottom
    gap = (2*hw - n*STRIP_W) / (n - 1)
    x = -hw
    for i in range(n):
        ax.add_patch(Rectangle((x, y0), STRIP_W, STRIP_L, facecolor=color, edgecolor="k", lw=0.8, zorder=3))
        x += STRIP_W + gap
    return y0, gap

def strips_bottom(ax, half_w_at, rows, color):
    for i in range(rows):
        y = EDGE + i * (STRIP_W + 0.12)
        hw = half_w_at(y)
        L = min(STRIP_L, 2*hw - 2*EDGE)
        ax.add_patch(Rectangle((-L/2, y), L, STRIP_W, facecolor=color, edgecolor="k", lw=0.8, zorder=3))

def draw(ax, title, wb, wt, H, r_top, r_bot, n_top, n_bot, rod_y, note):
    ax.set_aspect("equal"); ax.axis("off"); ax.set_title(title, fontsize=13, loc="left")
    hw = trapezoid(ax, wb, wt, H, r_top, r_bot)
    y0, gap = strips_top_row(ax, hw, H, n_top, "#4c9be8")
    strips_bottom(ax, hw, n_bot, "#f0a35e")
    # rod, seen through the plate
    ax.add_patch(Circle((0, rod_y), 0.5, fill=False, ls="--", lw=1.2, ec="#888", zorder=4))
    ax.annotate("rod, on the other side", xy=(0.5, rod_y), xytext=(wt/2 + 0.6, rod_y - 0.9),
                fontsize=8, color="#666", va="center", arrowprops=dict(arrowstyle="->", color="#888", lw=0.8))
    # no-strip band (only worth marking when there is one)
    yb = EDGE + n_bot * (STRIP_W + 0.12) + 0.1
    if y0 - yb > 1.5:
        ax.add_patch(Rectangle((-hw(yb) + 0.2, yb), 2*hw(yb) - 0.4, y0 - yb - 0.1, facecolor="none",
                               edgecolor="#7f8c8d", ls=":", lw=1.2, zorder=2))
        ax.text(0, (yb + y0) / 2, "OPTIONAL\nstrips here take ~15% off the\ntop row and cannot hurt;\n"
                "skip them to save strips",
                ha="center", va="center", fontsize=9, color="#555")
    ax.text(0, y0 + STRIP_L / 2, f"{n_top} x Large\ntension row", ha="center", va="center", fontsize=9,
            color="white", weight="bold", zorder=5,
            bbox=dict(boxstyle="round,pad=0.3", fc="#2c6fb0", ec="none", alpha=0.9))
    ax.text(0, -0.55, note, ha="center", va="top", fontsize=9, color="#333")
    # dims
    ax.annotate("", (wt/2 + 0.35, 0), (wt/2 + 0.35, H), arrowprops=dict(arrowstyle="<->", lw=0.8))
    ax.text(wt/2 + 0.5, H/2, f"{H} in", va="center", fontsize=9)
    ax.annotate("", (-wt/2, H + 0.35), (wt/2, H + 0.35), arrowprops=dict(arrowstyle="<->", lw=0.8))
    ax.text(0, H + 0.5, f"{wt} in", ha="center", fontsize=9)
    if wb != wt:
        ax.annotate("", (-wb/2, -0.25), (wb/2, -0.25), arrowprops=dict(arrowstyle="<->", lw=0.8))
        ax.text(0, -0.2, f"{wb} in", ha="center", va="bottom", fontsize=9)
    ax.set_xlim(-wt/2 - 1.2, wt/2 + 1.6); ax.set_ylim(-1.6, H + 1.0)

fig, axes = plt.subplots(1, 2, figsize=(15, 8.5), gridspec_kw=dict(width_ratios=[1.35, 1]))
draw(axes[0], "Body peg, wall face (the side that touches the wall)",
     4.0, 8.5, 9.5, 0.75, 0.5, 7, 2, rod_y=0.95,
     note="Top row carries the moment: ~0.4 lb tension per strip at 4 lb on the rod.\n"
          "Bottom strips are the compression bearing and keep the plate flat.")
draw(axes[1], "Neck peg, wall face",
     6.0, 6.0, 5.0, 0.25, 0.25, 6, 1, rod_y=0.95,
     note="Headstock-end peg carries ~1.5 lb -> ~0.4 lb per top strip.\nHeel peg is a guard and carries nothing.")
fig.text(0.5, 0.01, "Blue = 3M Large picture-hanging strips (3/4 x 3-1/2 in), tops flush to the top edge (0.15 in in).  "
         "Orange = bearing strips.  Wipe wall and plate with isopropyl, press 30 s, wait 24 h.",
         ha="center", fontsize=9.5, color="#333")
plt.tight_layout(rect=(0, 0.04, 1, 1))
plt.savefig("renders/10_strip_layout.png", dpi=120)
print("ok")
