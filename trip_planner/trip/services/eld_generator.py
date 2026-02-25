"""
ELD Daily Log Sheet Generator.

Generates a FMCSA-compliant Driver's Daily Log as a PDF from scratch
using reportlab. One call per day produces one page.

Grid layout mirrors the official FMCSA paper log:
  - 4 duty-status rows: Off Duty, Sleeper Berth, Driving, On Duty (ND)
  - 24-hour axis (midnight to midnight)
  - Activities filled in as thick horizontal lines through the correct row
  - Header: date, From/To, miles, carrier
  - Remarks: list of stops with times
  - Recap: 70-hr/8-day column
"""

from __future__ import annotations

import io
from dataclasses import dataclass
from datetime import date, datetime
from typing import List, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas as rl_canvas

# ── Data Transfer Object ──────────────────────────────────────────────────────


@dataclass
class ActivityEntry:
    start_hour: float  # 0.0–24.0
    end_hour: float
    status: str  # off_duty | sleeper_berth | driving | on_duty_nd


@dataclass
class ELDLogInput:
    log_date: date
    day_number: int
    activities: List[dict]  # [{start_hour, end_hour, status}]
    total_driving_hours: float
    total_on_duty_hours: float
    total_off_duty_hours: float
    total_sleeper_hours: float
    cycle_hours_used: float
    from_location: str
    to_location: str
    total_miles: float
    trip_id: int = 0
    carrier_name: str = "Carrier Name"
    driver_name: str = "Driver"
    truck_number: str = "Truck #"
    remarks: Optional[List[str]] = None  # free-text remarks lines


# ── Generator ─────────────────────────────────────────────────────────────────

ROW_LABELS = [
    "1. Off Duty",
    "2. Sleeper\n   Berth",
    "3. Driving",
    "4. On Duty\n   (Not Driving)",
]
STATUS_TO_ROW = {
    "off_duty": 0,
    "sleeper_berth": 1,
    "driving": 2,
    "on_duty_nd": 3,
}


class ELDGenerator:
    """Generate a single-page FMCSA Daily Log PDF for one day."""

    # Page layout constants (in points; 1 inch = 72 points)
    PAGE_W, PAGE_H = letter  # 612 × 792

    MARGIN_L = 0.65 * inch
    MARGIN_R = 0.65 * inch
    MARGIN_T = 0.75 * inch

    # Grid dimensions
    GRID_X = MARGIN_L + 1.05 * inch  # left edge of grid (after row labels)
    GRID_Y_TOP = PAGE_H - MARGIN_T - 1.9 * inch  # top of first row
    GRID_W = PAGE_W - GRID_X - MARGIN_R - 0.45 * inch  # room for totals column
    ROW_H = 0.32 * inch
    GRID_H = ROW_H * 4

    TOTALS_X = GRID_X + GRID_W + 0.05 * inch

    def generate(self, log_input: ELDLogInput) -> bytes:
        """Return raw PDF bytes for the given daily log."""
        buf = io.BytesIO()
        c = rl_canvas.Canvas(buf, pagesize=letter)
        c.setTitle(f"ELD Daily Log — Day {log_input.day_number} ({log_input.log_date})")

        self._draw_title(c, log_input)
        self._draw_header(c, log_input)
        self._draw_grid(c, log_input)
        self._draw_remarks(c, log_input)
        self._draw_recap(c, log_input)

        c.showPage()
        c.save()
        buf.seek(0)
        return buf.read()

    # ── Title ───────────────────────────────────────────────────────────────

    def _draw_title(self, c: rl_canvas.Canvas, d: ELDLogInput) -> None:
        y = self.PAGE_H - self.MARGIN_T
        c.setFont("Helvetica-Bold", 14)
        c.drawString(self.MARGIN_L, y, "Driver's Daily Log  (24 Hours)")
        c.setFont("Helvetica", 10)
        date_str = d.log_date.strftime("%m / %d / %Y")
        c.drawString(self.PAGE_W - self.MARGIN_R - 2.4 * inch, y, f"Date: {date_str}")
        c.setFont("Helvetica", 8)
        c.drawString(
            self.MARGIN_L,
            y - 14,
            "Original – File at home terminal.  Duplicate – Driver retains for 8 days.",
        )

    # ── Header block ────────────────────────────────────────────────────────

    def _draw_header(self, c: rl_canvas.Canvas, d: ELDLogInput) -> None:
        y = self.PAGE_H - self.MARGIN_T - 0.45 * inch
        lx = self.MARGIN_L
        rx = self.PAGE_W / 2 + 0.1 * inch

        c.setFont("Helvetica", 9)
        c.drawString(lx, y, f"From:  {d.from_location}")
        c.drawString(rx, y, f"To:  {d.to_location}")

        y -= 18
        c.drawString(lx, y, f"Total Miles Driving Today:  {d.total_miles:.1f} mi")
        c.drawString(rx, y, f"Carrier:  {d.carrier_name}")

        y -= 18
        c.drawString(lx, y, f"Truck / Tractor:  {d.truck_number}")
        c.drawString(rx, y, f"Driver:  {d.driver_name}")

        # Horizontal rule
        y -= 10
        c.setLineWidth(0.5)
        c.line(lx, y, self.PAGE_W - self.MARGIN_R, y)

    # ── 24-hour grid ────────────────────────────────────────────────────────

    def _draw_grid(self, c: rl_canvas.Canvas, d: ELDLogInput) -> None:
        gx = self.GRID_X
        gy_top = self.GRID_Y_TOP
        gw = self.GRID_W
        rh = self.ROW_H

        # ── Row label column ────────────────────────────────────────────────
        label_x = self.MARGIN_L
        for i, label in enumerate(ROW_LABELS):
            row_y = gy_top - i * rh
            c.setFont("Helvetica", 7)
            # Multi-line labels
            lines = label.split("\n")
            for li, line in enumerate(lines):
                c.drawString(label_x, row_y - 8 - li * 10, line.strip())

        # ── Hour tick marks & numbers ────────────────────────────────────────
        # 25 vertical lines for hours 0‥24; minor ticks every 15 min
        SUBDIVISIONS = 4  # 15-min intervals
        total_cols = 24 * SUBDIVISIONS
        col_w = gw / total_cols

        c.setFont("Helvetica", 6)
        c.setLineWidth(0.3)
        for col in range(total_cols + 1):
            x = gx + col * col_w
            is_hour = col % SUBDIVISIONS == 0
            is_half = col % (SUBDIVISIONS // 2) == 0 and not is_hour
            tick_len = 6 if is_hour else (3 if is_half else 1.5)

            # Draw tick at top
            c.line(x, gy_top + tick_len, x, gy_top)
            # Draw full vertical grid line
            c.setLineWidth(0.5 if is_hour else 0.2)
            c.line(x, gy_top, x, gy_top - self.GRID_H)
            c.setLineWidth(0.3)

            if is_hour:
                hour_num = col // SUBDIVISIONS
                label = self._hour_label(hour_num)
                c.setFont("Helvetica", 6)
                c.drawCentredString(x, gy_top + 8, label)

        # ── Horizontal row borders ───────────────────────────────────────────
        c.setLineWidth(0.8)
        for i in range(5):
            y = gy_top - i * rh
            c.line(gx, y, gx + gw, y)

        # ── Activity lines (filled sections) ────────────────────────────────
        LINE_Y_OFFSET = rh / 2  # centre of row
        for activity in d.activities:
            row_idx = STATUS_TO_ROW.get(activity["status"])
            if row_idx is None:
                continue
            sh = max(0.0, float(activity["start_hour"]))
            eh = min(24.0, float(activity["end_hour"]))
            if eh <= sh:
                continue

            x1 = gx + (sh / 24.0) * gw
            x2 = gx + (eh / 24.0) * gw
            y_line = gy_top - row_idx * rh - LINE_Y_OFFSET

            c.setLineWidth(3.5)
            c.setStrokeColor(colors.black)
            c.line(x1, y_line, x2, y_line)
            c.setLineWidth(0.8)

            # Vertical connector at start and end
            c.setLineWidth(1.5)
            c.line(x1, gy_top - row_idx * rh, x1, gy_top - (row_idx + 1) * rh)
            c.line(x2, gy_top - row_idx * rh, x2, gy_top - (row_idx + 1) * rh)
            c.setLineWidth(0.8)

        # ── Total hours column ───────────────────────────────────────────────
        tx = self.TOTALS_X
        totals = [
            d.total_off_duty_hours,
            d.total_sleeper_hours,
            d.total_driving_hours,
            d.total_on_duty_hours - d.total_driving_hours,  # on_duty_nd only
        ]
        c.setFont("Helvetica-Bold", 8)
        c.drawString(tx, gy_top + 8, "Total")
        for i, val in enumerate(totals):
            y = gy_top - i * rh - LINE_Y_OFFSET
            display = f"{val:.2f}"
            c.setFont("Helvetica", 8)
            c.drawString(tx, y - 4, display)

    @staticmethod
    def _hour_label(h: int) -> str:
        if h == 0:
            return "Mid-\nnght"
        if h == 12:
            return "Noon"
        if h == 24:
            return "Mid-\nnght"
        return str(h)

    # ── Remarks ─────────────────────────────────────────────────────────────

    def _draw_remarks(self, c: rl_canvas.Canvas, d: ELDLogInput) -> None:
        y = self.GRID_Y_TOP - self.GRID_H - 0.3 * inch
        lx = self.MARGIN_L

        c.setFont("Helvetica-Bold", 9)
        c.drawString(lx, y, "Remarks:")
        c.setLineWidth(0.5)
        c.line(lx, y - 2, self.PAGE_W - self.MARGIN_R, y - 2)

        c.setFont("Helvetica", 8)
        remarks = d.remarks or []
        # Default auto-remarks from data
        auto = [
            f"Day {d.day_number} of trip | Date: {d.log_date.strftime('%m/%d/%Y')}",
            f"From: {d.from_location}  →  To: {d.to_location}",
            f"Total driving: {d.total_driving_hours:.2f} hrs  |  "
            f"Total on-duty: {d.total_on_duty_hours:.2f} hrs  |  "
            f"Miles today: {d.total_miles:.1f}",
        ]
        all_remarks = auto + list(remarks)

        y -= 16
        for line in all_remarks[:8]:  # max 8 lines
            c.drawString(lx + 6, y, str(line))
            y -= 12

    # ── Recap (70-hr/8-day) ──────────────────────────────────────────────────

    def _draw_recap(self, c: rl_canvas.Canvas, d: ELDLogInput) -> None:
        y = self.GRID_Y_TOP - self.GRID_H - 1.9 * inch
        lx = self.MARGIN_L
        rx = self.PAGE_W / 2

        c.setFont("Helvetica-Bold", 9)
        c.drawString(lx, y, "Recap:  70 Hour / 8 Day Drivers")
        c.setLineWidth(0.5)
        c.line(lx, y - 3, self.PAGE_W - self.MARGIN_R, y - 3)

        c.setFont("Helvetica", 8)
        rows = [
            ("A. Total hours on duty today", f"{d.total_on_duty_hours:.2f} hrs"),
            (
                "B. Total hours available tomorrow (70 − A)",
                f"{max(0, CYCLE_LIMIT_HRS - d.cycle_hours_used):.2f} hrs",
            ),
            ("C. Cycle hours used to date", f"{d.cycle_hours_used:.2f} hrs"),
        ]
        y -= 18
        for label, value in rows:
            c.drawString(lx + 6, y, label)
            c.drawString(rx, y, value)
            y -= 14

        c.setFont("Helvetica-Oblique", 7)
        c.drawString(lx, y - 4, "* If you took a 34-hr restart, enter 0 for line C.")


# ── Convenience constant (used in recap) ────────────────────────────────────
CYCLE_LIMIT_HRS = 70.0
