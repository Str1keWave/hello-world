"""Plan-view diagram: where the pegs sit under a horizontally hung dreadnought."""
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Circle, Polygon
from scipy.interpolate import PchipInterpolator

# ---- dreadnought (D-28-ish) outline, inches from the tail, half-widths ----------
body_x = [0, 0.25, 0.8, 1.8, 3.2, 5.5, 8.0, 10.0, 11.5, 12.5, 14.0, 16.5, 18.0, 19.2, 19.8, 20.0]
body_w = [0, 3.2, 5.2, 6.6, 7.4, 7.8, 7.4, 6.4, 5.55, 5.45, 5.6, 5.75, 5.4, 4.3, 2.4, 1.1]
half = PchipInterpolator(body_x, body_w)
xb = np.linspace(0, 20, 400)
neck_x = np.array([20, 34.0])                  # heel to nut
neck_w = np.array([1.12, 0.86])
head_x = np.array([34.0, 34.6, 36.5, 40.0, 41.0, 41.0])
head_w = np.array([0.86, 1.2, 1.5, 1.6, 1.3, 0.0])

def outline():
    top = list(zip(xb, half(xb))) + list(zip(neck_x, neck_w)) + list(zip(head_x, head_w))
    bot = [(x, -w) for x, w in reversed(top)]
    return np.array(top + bot)

def edge(x):
    """y of the bottom edge at x."""
    if x <= 20: return -float(half(x))
    if x <= 34: return -float(np.interp(x, neck_x, neck_w))
    return -float(np.interp(x, head_x, head_w))

ROD_R = 0.5
PEGS = {  # name: (x from tail, plate height, role, colour)
    "1  waist (carries ~3.6-4 lb)":          (12.0, 9.5, "carries", "#1f77b4"),
    "2  headstock-end neck (carries ~1.5 lb)": (32.5, 5.0, "carries", "#1f77b4"),
    "3  heel neck (guard, card gap)":        (22.0, 5.0, "guard",   "#7f7f7f"),
    "4  lower bout (guard, card gap)":       (5.5,  5.0, "guard",   "#d62728"),
}
COG = (16.0, 19.0)

def draw(ax, failed=None, title=""):
    ax.set_aspect("equal")
    # wall
    ax.add_patch(Rectangle((-4, -14), 50, 24, color="#f3efe6", zorder=0))
    # plates first (they sit behind the guitar)
    for name, (x, H, role, col) in PEGS.items():
        if failed == name: continue
        y_rod = edge(x) - ROD_R - (0.03 if role == "guard" else 0)
        y0 = y_rod - 0.95                     # rod centreline is 0.95 above the plate's bottom edge
        ax.add_patch(Rectangle((x - 3, y0), 6, H, facecolor=col, alpha=0.18, edgecolor=col, lw=1.2, zorder=1))
    # guitar
    poly = outline()
    dy = 0.0
    if failed:  # guitar drops onto the next supports: rotate/settle approx by translating down ~0.1 (exaggerated for visibility)
        dy = -0.35
    ax.add_patch(Polygon(poly + [0, dy], closed=True, facecolor="#c9924b", edgecolor="#5a3a1a", lw=1.5, alpha=0.80, zorder=3))
    # soundhole + bridge for orientation
    ax.add_patch(Circle((13.5, dy), 2.0, facecolor="#2b1a0e", zorder=4))
    ax.add_patch(Rectangle((7.4, -3 + dy), 1.2, 6, facecolor="#2b1a0e", zorder=4))
    for fx in np.linspace(20.7, 33.6, 14):
        ax.plot([fx, fx], [edge(fx) + dy, -edge(fx) + dy], color="#7a5a3a", lw=0.8, zorder=4)
    # rods (end view) on top
    for name, (x, H, role, col) in PEGS.items():
        if failed == name:
            ax.text(x, edge(x) - 2.6, "FAILED", ha="center", color="#d62728", fontsize=11, weight="bold", zorder=6)
            continue
        y_rod = edge(x) - ROD_R - (0.03 if role == "guard" else 0)
        ax.add_patch(Circle((x, y_rod), ROD_R, facecolor="#dddddd", edgecolor=col, lw=2.2, zorder=5))
        ax.text(x, y_rod - 1.0, name.split()[0], ha="center", va="top", fontsize=13, weight="bold", color=col, zorder=6)
    # balance point
    ax.axvspan(COG[0], COG[1], ymin=0.5, ymax=0.62, color="#2ca02c", alpha=0.25, zorder=6)
    ax.annotate("balance point\n(16-19 in from tail)", xy=(17.5, 1.5), xytext=(17.5, 8.4), ha="center",
                fontsize=10, color="#2ca02c", arrowprops=dict(arrowstyle="->", color="#2ca02c"), zorder=7)
    # dimension ticks along the bottom
    for x in range(0, 42, 5):
        ax.plot([x, x], [-13.2, -12.8], color="k", lw=0.8); ax.text(x, -13.9, f"{x}", ha="center", fontsize=8)
    ax.text(20.5, -14.5, "inches from tail", ha="center", fontsize=8, style="italic")
    ax.set_xlim(-3, 44); ax.set_ylim(-14.5, 9.5); ax.axis("off")
    ax.set_title(title, fontsize=13, loc="left")

fig, axes = plt.subplots(2, 1, figsize=(15, 13))
draw(axes[0], title="Normal: guitar rests on pegs 1 and 2; pegs 3 and 4 sit a card-thickness below and carry nothing")
draw(axes[1], failed="1  waist (carries ~3.6-4 lb)",
     title="If the waist peg lets go: guitar drops onto 4 + 2 (balance point is between them, so it stays put)")
handles = [plt.Line2D([], [], marker="o", ls="", mfc="#dddddd", mec=c, mew=2.2, ms=12, label=n) for n, (_, _, _, c) in PEGS.items()]
handles.append(Rectangle((0, 0), 1, 1, facecolor="#1f77b4", alpha=0.18, edgecolor="#1f77b4", label="Command-strip plate (behind guitar); 9.5 in tall at the waist, 5 in elsewhere"))
fig.legend(handles=handles, loc="lower center", ncol=2, fontsize=10, frameon=False)
plt.tight_layout(rect=(0, 0.07, 1, 1))
plt.savefig("renders/09_peg_layout.png", dpi=110)
print("ok")
