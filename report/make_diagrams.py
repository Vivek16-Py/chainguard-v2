"""Generate print-friendly diagrams for the ChainGuard v2 seminar report."""

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch, Polygon

OUT = Path(__file__).resolve().parent / "diagrams"
OUT.mkdir(parents=True, exist_ok=True)

plt.rcParams.update(
    {
        "font.family": "DejaVu Sans",
        "font.size": 8,
        "savefig.facecolor": "white",
        "figure.facecolor": "white",
        "pdf.fonttype": 42,
    }
)

INK = "#0f172a"
SLATE = "#334155"
MUTED = "#64748b"
LINE = "#94a3b8"
GRID = "#cbd5e1"
PANEL = "#f8fafc"
EMERALD = "#047857"
EMERALD_L = "#ecfdf5"
AMBER = "#b45309"
AMBER_L = "#fffbeb"
ROSE = "#be123c"
ROSE_L = "#fff1f2"
CYAN = "#0e7490"
CYAN_L = "#ecfeff"
INDIGO = "#4338ca"
INDIGO_L = "#eef2ff"


def canvas(w, h):
    fig, ax = plt.subplots(figsize=(w, h))
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis("off")
    fig.subplots_adjust(left=0, right=1, top=1, bottom=0)
    return fig, ax


def box(ax, x, y, w, h, fc, ec, lw=1.1, rad=1.4, z=2):
    ax.add_patch(
        FancyBboxPatch(
            (x, y),
            w,
            h,
            boxstyle=f"round,pad=0,rounding_size={rad}",
            facecolor=fc,
            edgecolor=ec,
            linewidth=lw,
            zorder=z,
        )
    )


def text(ax, x, y, s, size=7.4, color=INK, weight="normal", ha="center", va="center", style="normal"):
    ax.text(
        x,
        y,
        s,
        fontsize=size,
        color=color,
        fontweight=weight,
        ha=ha,
        va=va,
        fontstyle=style,
        linespacing=1.35,
        zorder=6,
    )


def arrow(ax, a, b, color=SLATE, lw=1.0, style="-|>", rad=0.0, ls="-", ms=9):
    ax.add_patch(
        FancyArrowPatch(
            a,
            b,
            arrowstyle=style,
            mutation_scale=ms,
            color=color,
            linewidth=lw,
            linestyle=ls,
            connectionstyle=f"arc3,rad={rad}",
            shrinkA=0,
            shrinkB=0,
            zorder=4,
        )
    )


def save(fig, name):
    path = OUT / name
    fig.savefig(path, dpi=230, bbox_inches="tight", pad_inches=0.05)
    plt.close(fig)
    print("wrote", path)


# ---------------------------------------------------------------------------
# Figure 3.1 -- four-plane architecture
# ---------------------------------------------------------------------------
def architecture():
    fig, ax = canvas(10, 7.2)

    text(ax, 1.5, 97.6, "ACTORS", 7, MUTED, "bold", ha="left")

    # Actors
    actors = [
        ("Vendor operator", "dispatch desk"),
        ("Driver", "in-cab device"),
        ("Customer", "doorstep phone"),
        ("Warehouse auditor", "returns bay"),
    ]
    xs = [4, 27, 50, 73]
    for x, (name, sub) in zip(xs, actors):
        box(ax, x, 87.2, 21, 8.6, "#ffffff", GRID, lw=1.0)
        text(ax, x + 10.5, 92.8, name, 8.0, INK, "bold")
        text(ax, x + 10.5, 89.5, sub, 6.7, MUTED)

    # Presentation
    portals = [
        ("Vendor Dispatch\nTerminal", "manifest capture · seal issue\nfleet board · sample load", EMERALD, EMERALD_L),
        ("Driver Telemetry\nPortal", "GPS + speed pings · checkpoints\nincident beacons", CYAN, CYAN_L),
        ("Customer Verification\nPortal", "QR seal check · intact/damaged\ncounts · unlock token", INDIGO, INDIGO_L),
        ("Audit & Reconciliation\nPlane", "five KPIs · return check-in\ntrust scorecard · exception feed", AMBER, AMBER_L),
    ]
    for x, (title, body, edge, fill) in zip(xs, portals):
        box(ax, x, 64.5, 21, 15.6, fill, edge, lw=1.2)
        text(ax, x + 10.5, 76.0, title, 8.2, edge, "bold")
        text(ax, x + 10.5, 69.5, body, 6.6, SLATE)
        arrow(ax, (x + 10.5, 87.2), (x + 10.5, 80.1), LINE, 0.9)

    # Domain container
    box(ax, 3, 31.5, 94, 26.2, PANEL, GRID, lw=1.0, rad=1.8)
    engines = [
        ("Seal & token\nissuance", "SEAL-####-C\nUNLK-XXXX-XXXX", EMERALD),
        ("Telemetry &\nincidents", "route state\nGPS anchor + time", CYAN),
        ("Delivery\nattestation", "intact + swapped\nsigned note", INDIGO),
        ("Discrepancy\nengine", "E, R, V\npayout lock", ROSE),
        ("KPI & trust\nscorecard", "5 KPIs · CSV\ntrust score", AMBER),
    ]
    exs = [4.5, 22.4, 40.3, 58.2, 76.1]
    for x, (title, body, edge) in zip(exs, engines):
        box(ax, x, 42.6, 16.4, 12.4, "#ffffff", edge, lw=1.0)
        text(ax, x + 8.2, 51.4, title, 7.4, edge, "bold")
        text(ax, x + 8.2, 45.9, body, 6.2, SLATE)
        arrow(ax, (x + 8.2, 42.6), (x + 8.2, 38.7), LINE, 0.8)

    box(ax, 10, 33.6, 80, 4.6, "#e2e8f0", "#94a3b8", lw=1.0, rad=1.0)
    text(ax, 50, 35.9, "Single reactive store  ·  Zustand + persist middleware  ·  dispatches + active role", 6.9, INK, "bold")

    for x in xs:
        arrow(ax, (x + 10.5, 64.5), (x + 10.5, 57.9), LINE, 0.9, style="<|-|>")

    # Persistence
    box(ax, 4, 17.2, 28, 8.6, "#ffffff", GRID, lw=1.0)
    text(ax, 18, 23.4, "localStorage snapshot", 7.5, INK, "bold")
    text(ax, 18, 19.7, "chainguard-v2-state · version 1\nsurvives reload and redeploy", 6.4, MUTED)

    box(ax, 34, 17.2, 28, 8.6, "#ffffff", GRID, lw=1.0)
    text(ax, 48, 23.4, "CSV manifest export", 7.5, INK, "bold")
    text(ax, 48, 19.7, "fleet, cargo, shortage\nand payout columns", 6.4, MUTED)

    box(ax, 64, 17.2, 32, 8.6, "#ffffff", GRID, lw=1.0)
    text(ax, 80, 23.4, "Audit evidence trail", 7.5, INK, "bold")
    text(ax, 80, 19.7, "seal receipt · attestation\nincident log · return record", 6.4, MUTED)

    arrow(ax, (30, 33.6), (18, 25.8), LINE, 0.9, rad=0.0)
    arrow(ax, (72, 33.6), (80, 25.8), LINE, 0.9, rad=0.0)

    # Delivery
    box(ax, 4, 3.2, 92, 8.2, "#0f172a", "#0f172a", lw=1.0)
    text(ax, 50, 8.0, "Vite 6 production bundle  →  static SPA on Vercel edge CDN  →  SPA rewrite", 7.7, "#f8fafc", "bold")
    text(ax, 50, 5.0, "chainguard-v2-ten.vercel.app   ·   no backend, no API keys, no runtime secrets", 6.4, "#cbd5e1")
    arrow(ax, (50, 17.2), (50, 11.4), LINE, 0.9)

    save(fig, "fig_3_1_architecture.png")


# ---------------------------------------------------------------------------
# Figure 3.2 -- custody lifecycle
# ---------------------------------------------------------------------------
def lifecycle():
    fig, ax = canvas(10, 6.4)

    # start
    ax.add_patch(plt.Circle((5.5, 70), 1.25, color=INK, zorder=4))
    text(ax, 5.5, 65.5, "Manifest\nsubmitted", 6.8, MUTED)

    states = [
        (12, 61, 26, 17, "EN_ROUTE_SEALED", "seal SEALED · cargo hold locked", EMERALD, EMERALD_L),
        (50, 61, 28, 17, "AWAITING_RETURN", "seal BROKEN · unlock token spent", INDIGO, INDIGO_L),
        (22, 24, 24, 15, "RECONCILED", "seal RECONCILED · payout released", EMERALD, EMERALD_L),
        (57, 24, 28, 15, "FRAUD_FLAGGED", "seal VOIDED · payout LOCKED", ROSE, ROSE_L),
    ]
    for x, y, w, h, title, sub, edge, fill in states:
        box(ax, x, y, w, h, fill, edge, lw=1.4, rad=1.4)
        text(ax, x + w / 2, y + h - 4.4, title, 8.4, edge, "bold")
        text(ax, x + w / 2, y + 4.6, sub, 6.4, SLATE)

    arrow(ax, (6.8, 70), (12, 70), SLATE, 1.1)
    arrow(ax, (38, 69.5), (50, 69.5), SLATE, 1.1)
    text(ax, 44, 74.4, "customer attests\n+ unlock token", 6.5, INDIGO, "bold")

    arrow(ax, (56, 61), (41, 39), SLATE, 1.0, rad=0.0)
    text(ax, 40.5, 52.5, "check-in\nV = 0", 6.6, EMERALD, "bold", ha="right")

    arrow(ax, (66, 61), (69, 39), SLATE, 1.0)
    text(ax, 71.5, 52.5, "check-in\nV ≠ 0", 6.6, ROSE, "bold", ha="left")

    # self loop for telemetry
    arrow(ax, (18, 78), (30, 78), CYAN, 1.0, style="-|>", rad=-0.7, ms=9)
    text(ax, 24, 87.6, "telemetry ping · deviation · incident\n(dispatch state unchanged)", 6.4, CYAN, ha="center")

    # closure node
    box(ax, 36, 5.6, 30, 7.4, "#f1f5f9", GRID, lw=1.0, rad=1.2)
    text(ax, 51, 9.3, "Custody closed · audit record retained", 6.9, SLATE, "bold")
    arrow(ax, (34, 24), (44, 13.2), LINE, 0.9, ls="--")
    arrow(ax, (68, 24), (58, 13.2), LINE, 0.9, ls="--")

    text(
        ax,
        50,
        1.0,
        "One manifest → one seal → one single-use unlock token → one return record.  Any non-zero variance locks settlement.",
        6.6,
        MUTED,
        style="italic",
    )

    save(fig, "fig_3_2_lifecycle.png")


# ---------------------------------------------------------------------------
# Figure 4.1 -- end-to-end swimlane workflow
# ---------------------------------------------------------------------------
def workflow():
    fig, ax = canvas(10, 7.0)

    lanes = [
        ("VENDOR", 78, 18, EMERALD, EMERALD_L),
        ("DRIVER", 58, 18, CYAN, CYAN_L),
        ("CUSTOMER", 38, 18, INDIGO, INDIGO_L),
        ("AUDIT", 18, 18, AMBER, AMBER_L),
    ]
    for name, y, h, edge, fill in lanes:
        box(ax, 1, y, 97, h, fill, "#e2e8f0", lw=0.8, rad=0.8)
        ax.add_patch(
            FancyBboxPatch(
                (1, y),
                13,
                h,
                boxstyle="round,pad=0,rounding_size=0.8",
                facecolor=edge,
                edgecolor=edge,
                linewidth=0.8,
                zorder=3,
            )
        )
        text(ax, 7.5, y + h / 2, name, 7.4, "#ffffff", "bold")

    def step(x, y, w, h, num, title, body, edge, dashed=False):
        box(ax, x, y, w, h, "#ffffff", edge, lw=1.1, rad=1.0)
        if dashed:
            ax.patches[-1].set_linestyle((0, (3, 2)))
        ax.add_patch(plt.Circle((x + 2.6, y + h - 2.5), 1.55, color=edge, zorder=5))
        text(ax, x + 2.6, y + h - 2.5, str(num), 6.6, "#ffffff", "bold")
        text(ax, x + 4.9, y + h - 2.9, title, 7.0, INK, "bold", ha="left")
        text(ax, x + 2.2, y + 2.8, body, 6.2, SLATE, ha="left")

    # vendor
    step(16, 82, 22, 10, 1, "Capture manifest", "client · address · qty · buffer\ndriver · vehicle · route", EMERALD)
    step(41, 82, 24, 10, 2, "Issue seal & dispatch", "SEAL-####-C + DSP-####\nstatus EN_ROUTE_SEALED", EMERALD)

    # driver
    step(41, 62, 24, 10, 3, "Stream telemetry", "speed · GPS · checkpoints\nevery 3.4 s while on route", CYAN)
    step(68, 62, 20, 10, 4, "Beacon incident", "breakdown · impact · blockade\nGPS + timestamp", CYAN, dashed=True)

    # customer
    step(16, 42, 24, 10, 5, "Verify at doorstep", "scan QR · confirm seal intact\ncount intact / damaged", INDIGO)
    step(44, 42, 24, 10, 6, "Attest & authorise", "mandatory note on swap\nsignature · single-use UNLK", INDIGO)

    # audit
    step(44, 22, 24, 10, 7, "Check in return", "count buffer against\ncustomer-attested manifest", AMBER)
    step(72, 22, 24, 10, 8, "Reconcile or flag", "V = 0 → payout released\nV ≠ 0 → P1 alert + lock", AMBER)

    arrow(ax, (38, 87), (41, 87), SLATE, 1.0)
    arrow(ax, (53, 82), (53, 72), SLATE, 1.0)
    arrow(ax, (44, 62), (36, 52), SLATE, 1.0)
    arrow(ax, (65, 67), (68, 67), CYAN, 1.0, ls="--")
    arrow(ax, (40, 47), (44, 47), SLATE, 1.0)
    arrow(ax, (56, 42), (56, 32), SLATE, 1.0)
    arrow(ax, (68, 27), (72, 27), SLATE, 1.0)
    arrow(ax, (78, 62), (84, 32), ROSE, 0.9, rad=-0.35, ls="--")
    text(ax, 88.4, 47.5, "evidence\nattached", 6.0, ROSE, style="italic")

    text(
        ax,
        50,
        11.6,
        "Every stage mutates the same persisted dispatch record, so the four role views never disagree.",
        6.8,
        MUTED,
        style="italic",
    )
    text(ax, 50, 6.4, "Custody hand-off", 6.4, MUTED, "bold")
    ax.plot([36, 70], [8.6, 8.6], color=LINE, lw=0.8)
    text(ax, 50, 3.4, "one manifest  ·  one seal  ·  one token  ·  one return count", 6.4, SLATE)

    save(fig, "fig_4_1_workflow.png")


# ---------------------------------------------------------------------------
# Figure 4.2 -- reconciliation decision flow
# ---------------------------------------------------------------------------
def reconciliation():
    fig, ax = canvas(9.4, 6.6)

    # inputs
    box(ax, 2, 84, 60, 10, "#f8fafc", GRID, lw=1.1)
    text(ax, 32, 91.1, "Counts captured per dispatch", 7.2, SLATE, "bold")
    text(ax, 32, 86.6, "E = declared buffer quantity B      ·      R = I intact + D damaged", 7.0, INK)

    box(ax, 70, 84, 28, 10, "#f1f5f9", SLATE, lw=1.1)
    text(ax, 84, 90.9, "Variance", 7.2, SLATE, "bold")
    text(ax, 84, 86.7, "V = E − R", 7.6, INK, "bold")

    arrow(ax, (62, 89), (70, 89), SLATE, 1.0)

    # main decision
    ax.add_patch(
        Polygon(
            [[50, 80], [68, 69], [50, 58], [32, 69]],
            closed=True,
            facecolor="#ffffff",
            edgecolor=SLATE,
            linewidth=1.2,
            zorder=3,
        )
    )
    text(ax, 50, 69, "V = 0?", 8.6, INK, "bold")
    arrow(ax, (83, 84), (56, 76.5), SLATE, 1.0, rad=-0.12)

    # fail branch
    box(ax, 2, 40, 28, 19, ROSE_L, ROSE, lw=1.3)
    text(ax, 16, 55.0, "FRAUD_FLAGGED", 8.0, ROSE, "bold")
    text(ax, 16, 49.4, "shortage V > 0\nor surplus V < 0", 6.8, SLATE)
    text(ax, 16, 43.2, "seal VOIDED · payout LOCKED\nPriority-1 shrinkage alert", 6.4, ROSE, "bold")
    arrow(ax, (32, 68.5), (30, 59), ROSE, 1.1)
    text(ax, 28.5, 64.0, "V ≠ 0", 6.7, ROSE, "bold", ha="right")

    # pass branch
    ax.add_patch(
        Polygon(
            [[50, 52], [68, 41], [50, 30], [32, 41]],
            closed=True,
            facecolor="#ffffff",
            edgecolor=SLATE,
            linewidth=1.2,
            zorder=3,
        )
    )
    text(ax, 50, 41, "D = attested\nswap count?", 7.2, INK, "bold")
    arrow(ax, (50, 58), (50, 52), SLATE, 1.1)
    text(ax, 52.2, 55.0, "V = 0", 6.7, EMERALD, "bold", ha="left")

    box(ax, 6, 13, 30, 12, EMERALD_L, EMERALD, lw=1.3)
    text(ax, 21, 21.6, "RECONCILED", 8.0, EMERALD, "bold")
    text(ax, 21, 16.8, "payout released\nseal chain closed", 6.6, SLATE)
    arrow(ax, (37, 38), (24, 25), EMERALD, 1.1)
    text(ax, 29.5, 33.0, "match", 6.6, EMERALD, "bold", ha="right")

    box(ax, 64, 13, 31, 12, AMBER_L, AMBER, lw=1.3)
    text(ax, 79.5, 21.6, "RECONCILED + note", 8.0, AMBER, "bold")
    text(ax, 79.5, 16.8, "count cleared, damage\nvariance attached to audit", 6.6, SLATE)
    arrow(ax, (63, 38), (76, 25), AMBER, 1.1)
    text(ax, 71.0, 33.0, "mismatch", 6.6, AMBER, "bold", ha="left")

    text(
        ax,
        50,
        6.0,
        "The return record is written once and surfaced in the exception feed; 0 is the only passing variance.",
        6.7,
        MUTED,
        style="italic",
    )

    save(fig, "fig_4_2_reconciliation.png")


if __name__ == "__main__":
    architecture()
    lifecycle()
    workflow()
    reconciliation()
