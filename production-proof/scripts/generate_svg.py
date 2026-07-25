#!/usr/bin/env python3
"""
Generates an editable production-proof SVG (Big Banner style) from a
plain Python data dict. The SVG can be opened directly in Adobe
Illustrator for manual touch-ups, or re-generated from new order data
by editing DATA below (or swapping in a JSON loader later).

Canvas is sized to A4 landscape at 96dpi (1122 x 793 px) so it renders
1:1 as a page in render_pdf.js.
"""
import html
import json
import os

W, H = 1122, 793

NAVY = "#1b2a6b"
RED = "#e2231a"
LIGHTBLUE = "#eaf3fb"
PINK = "#fbdde7"
GREY = "#8a8a8a"
BORDER = "#3a4fa0"

DATA = {
    "inv_no": "38594",
    "sales_person": "Nikki",
    "checked": ["SPELLING", "LAYOUT", "SIZES", "COLOURS", "QUANTITY"],
    "job_options": [
        "This order is approved as per this proof",
        "Approved with specified changes",
        "A further proof is required",
    ],
    "branded": True,
    "blind_shipping": False,
    "sides": [
        {
            "label": "front side",
            "panels": [
                {"caption": "NO.1_x6", "art": "COFFEE / bounce beans"},
                {"caption": "NO.2_x6", "art": "COFFEE / bounce beans"},
            ],
        },
        {
            "label": "back side",
            "panels": [
                {"caption": "CB-2mx1m-SQ", "art": "COFFEE / bounce beans"},
                {"caption": "CB-1mx1m-SQ", "art": "COFFEE / bounce beans"},
            ],
        },
    ],
    "extra_photos": [
        {"caption": "Single Steel Feet for Cafe Barrier x24", "note": "PHOTO"},
        {"caption": "Demo Image", "note": "PHOTO x2"},
    ],
    "product": {
        "Product": "2m Black Square Tube Cafe Barrier Double Side Reskin",
        "SKU": "CB-2mx1m-SQ & CB-1mx1m-SQ",
    },
    "print_side": "Double Side Printing",
    "qty": "As proof",
    "production_initials": ["C/C", "Trim", "Finish", "QC", "Pack"],
    "production_checklist": [
        "Labels", "Photo", "Booklets", "Stock taking", "Promo gifts",
        "Protection", "Over 25KG",
    ],
    "company": {
        "phone": "1300 550 168",
        "email": "sales@bigbanner.com.au",
        "offices": [
            ("Sydney", "340 Chisholm Rd", "Auburn NSW 2144"),
            ("Brisbane", "37 Smallwood St", "Underwood QLD 4119"),
            ("Melbourne", "71 Strzelecki Ave", "Sunshine West VIC 3020"),
        ],
    },
}


def esc(s):
    return html.escape(str(s), quote=True)


def checkbox(x, y, size, checked=False, stroke=NAVY):
    parts = [
        f'<rect x="{x}" y="{y}" width="{size}" height="{size}" '
        f'fill="white" stroke="{stroke}" stroke-width="1.6"/>'
    ]
    if checked:
        parts.append(
            f'<path d="M{x+size*0.15},{y+size*0.55} L{x+size*0.4},{y+size*0.82} '
            f'L{x+size*0.85},{y+size*0.15}" fill="none" stroke="{RED}" '
            f'stroke-width="{size*0.22}" stroke-linecap="round" stroke-linejoin="round"/>'
        )
    return "".join(parts)


def text(x, y, s, size=11, weight="normal", fill="#111", anchor="start",
          family="Arial, Helvetica, sans-serif", italic=False, letter_spacing=None):
    style = f'font-family="{family}" font-size="{size}" font-weight="{weight}" fill="{fill}" text-anchor="{anchor}"'
    if italic:
        style += ' font-style="italic"'
    if letter_spacing:
        style += f' letter-spacing="{letter_spacing}"'
    return f'<text x="{x}" y="{y}" {style}>{esc(s)}</text>'


def build_svg(d):
    parts = []
    parts.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
        f'viewBox="0 0 {W} {H}" font-family="Arial, Helvetica, sans-serif">'
    )
    parts.append(f'<rect x="0" y="0" width="{W}" height="{H}" fill="white"/>')

    # top divider rule
    parts.append(f'<rect x="0" y="0" width="{W}" height="4" fill="{NAVY}"/>')

    # ---------- WARNING block (top-left) ----------
    wx, wy, ww = 24, 16, 230
    parts.append(f'<path d="M{wx},{wy} L{wx+ww},{wy} L{wx+ww-14},{wy+22} L{wx},{wy+22} Z" fill="{NAVY}"/>')
    parts.append(text(wx + 12, wy + 15, "WARNING !", size=13, weight="bold", fill="white"))
    ty = wy + 40
    parts.append(text(wx, ty, "PLEASE CHECK PROOF CAREFULLY", size=7.5, weight="bold", fill="#222"))
    parts.append(text(wx, ty + 11, "WE DO OUR BEST, HOWEVER ONCE SIGNED OFF CUSTOMER", size=6, fill="#444"))
    parts.append(text(wx, ty + 20, "EXCEPTS RESPONSIBILITY FOR ANY MISSED ERRORS.", size=6, fill="#444"))

    ry = ty + 32
    rh = 62
    parts.append(f'<rect x="{wx}" y="{ry}" width="{ww}" height="{rh}" fill="{RED}"/>')
    parts.append(text(wx + 8, ry + 14, "Colours match:  $100+gst (upto 3 colours)", size=6.6, weight="bold", fill="white"))
    for i, line in enumerate([
        "is only available for PMS code. A maximum",
        "10% colour variance is acceptable without",
        "colour matching",
    ]):
        parts.append(text(wx + 8, ry + 26 + i * 11, line, size=6.6, fill="white"))

    # ---------- PLEASE CHECK center block ----------
    cx = 300
    parts.append(text(cx, 32, "PLEASE CHECK", size=22, weight="bold", fill=NAVY))
    # checkmark glyph
    ckx = cx + 190
    parts.append(f'<path d="M{ckx},22 L{ckx+8},32 L{ckx+24},8" fill="none" stroke="{RED}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>')
    parts.append(f'<line x1="{cx}" y1="44" x2="{cx+330}" y2="44" stroke="#222" stroke-width="1.4"/>')

    labels = ["SPELLING", "LAYOUT", "SIZES", "COLOURS", "QUANTITY"]
    lx = cx
    ly = 62
    for lab in labels:
        parts.append(checkbox(lx, ly - 9, 10, checked=(lab in d["checked"])))
        parts.append(text(lx + 15, ly, lab, size=8.5, weight="bold"))
        lx += 14 + len(lab) * 5.6 + 18

    parts.append(text(cx, 96, "Inv No.:", size=13, weight="bold"))
    parts.append(text(cx + 55, 96, d["inv_no"], size=13))
    parts.append(text(cx + 170, 96, "Sales Person:", size=13, weight="bold"))
    parts.append(text(cx + 265, 96, d["sales_person"], size=13))

    # ---------- JOB WILL NOT BEGIN box (top-right) ----------
    jx = 700
    parts.append(text(jx, 20, "JOB WILL NOT BEGIN UNTIL", size=11.5, weight="bold", fill=NAVY))
    parts.append(text(jx, 30, "THE APPROVAL BELOW IS FULLY COMPLETED", size=6.5, weight="bold", fill="#333"))
    oy = 40
    for i, opt in enumerate(d["job_options"]):
        parts.append(checkbox(jx, oy + i * 15 - 8, 9, stroke=NAVY))
        parts.append(text(jx + 13, oy + i * 15, opt, size=6.8, fill="#222"))

    dx = jx + 245
    parts.append(text(dx, 20, "Date:", size=8, italic=True))
    parts.append(f'<line x1="{dx+28}" y1="20" x2="{dx+90}" y2="20" stroke="#333" stroke-width="0.8"/>')
    parts.append(text(dx, 52, "Signature:", size=8, italic=True))
    parts.append(f'<line x1="{dx+38}" y1="52" x2="{dx+120}" y2="52" stroke="#333" stroke-width="0.8"/>')

    by = 100
    parts.append(checkbox(jx, by - 9, 12, checked=d["branded"], stroke=RED))
    parts.append(text(jx + 17, by, "Branded", size=11, weight="bold"))
    parts.append(checkbox(jx + 130, by - 9, 12, checked=d["blind_shipping"], stroke=NAVY))
    parts.append(text(jx + 147, by, "Blind Shipping", size=11, weight="bold"))

    parts.append(f'<line x1="0" y1="105" x2="{W}" y2="105" stroke="#222" stroke-width="1.4"/>')

    # ---------- image grid ----------
    grid_top = 128
    box_w, box_h = 340, 155
    gap_x, gap_y = 16, 20
    gx0 = 118

    for row, side in enumerate(d["sides"]):
        gy = grid_top + row * (box_h + gap_y + 34)
        parts.append(text(24, gy + box_h / 2, side["label"], size=12, weight="bold", anchor="start"))
        for col, panel in enumerate(side["panels"]):
            bx = gx0 + col * (box_w + gap_x)
            parts.append(f'<rect x="{bx}" y="{gy}" width="{box_w}" height="{box_h}" fill="{LIGHTBLUE}" stroke="{BORDER}" stroke-width="1"/>')
            parts.append(f'<rect x="{bx+6}" y="{gy+6}" width="{box_w-12}" height="{box_h-12}" fill="none" stroke="{BORDER}" stroke-width="0.6"/>')
            art_lines = panel["art"].split(" / ")
            ay = gy + box_h / 2 - (len(art_lines) * 9)
            for line in art_lines:
                parts.append(text(bx + box_w / 2, ay, line, size=15, weight="bold", fill=RED, anchor="middle"))
                ay += 22
            parts.append(text(bx + box_w / 2, gy + box_h + 16, panel["caption"], size=10, weight="bold", anchor="middle"))

    # ---------- extra photos column (right) ----------
    px = gx0 + 2 * box_w + gap_x + 24
    py = grid_top
    ph = 150
    pw = 150
    for i, photo in enumerate(d["extra_photos"]):
        py_i = py + i * (ph + 40)
        parts.append(f'<rect x="{px}" y="{py_i}" width="{pw}" height="{ph}" fill="{PINK}" stroke="{BORDER}" stroke-width="1"/>')
        parts.append(text(px + pw / 2, py_i + ph / 2, photo["note"], size=10, fill="#883355", anchor="middle"))
        parts.append(text(px + pw / 2, py_i + ph + 14, photo["caption"], size=9, anchor="middle"))

    # ---------- product detail block ----------
    pdy = grid_top + 2 * box_h + gap_y + 34 + 46
    parts.append(text(24, pdy, f'Product: {d["product"]["Product"]}', size=10.5))
    parts.append(text(24, pdy + 16, f'SKU: {d["product"]["SKU"]}', size=10.5))
    parts.append(text(24, pdy + 32, "Print:", size=10.5))
    single_checked = d["print_side"].startswith("Single")
    parts.append(checkbox(70, pdy + 24, 10, checked=single_checked, stroke=RED))
    parts.append(text(85, pdy + 32, "Single Side Printing", size=10.5))
    parts.append(checkbox(230, pdy + 24, 10, checked=not single_checked, stroke=RED))
    parts.append(text(245, pdy + 32, "Double Side Printing", size=10.5))
    parts.append(text(24, pdy + 48, f'QTY: {d["qty"]}', size=10.5))

    # ---------- dashed divider ----------
    dashed_y = pdy + 66
    parts.append(f'<line x1="0" y1="{dashed_y}" x2="{W}" y2="{dashed_y}" stroke="#334" stroke-width="1.2" stroke-dasharray="6,5"/>')

    # ---------- production use only ----------
    puy = dashed_y + 34
    parts.append(text(24, puy, "Production use only", size=15, weight="bold"))
    parts.append(text(200, puy - 18, "Initial:", size=9.5, italic=True))
    ix = 200
    for lab in d["production_initials"]:
        parts.append(f'<rect x="{ix}" y="{puy-10}" width="66" height="26" fill="white" stroke="#333" stroke-width="1"/>')
        parts.append(text(ix + 33, puy + 30, lab, size=9, anchor="middle"))
        ix += 74

    div_x = ix + 12
    parts.append(f'<line x1="{div_x}" y1="{puy-24}" x2="{div_x}" y2="{puy+40}" stroke="{RED}" stroke-width="1.2"/>')

    checklist = d["production_checklist"]
    col1 = checklist[0::2]
    col2 = checklist[1::2]
    clx1 = div_x + 24
    clx2 = clx1 + 170
    for i, lab in enumerate(col1):
        cy = puy - 18 + i * 16
        parts.append(checkbox(clx1, cy - 8, 9, stroke="#333"))
        parts.append(text(clx1 + 14, cy, lab, size=9))
    for i, lab in enumerate(col2):
        cy = puy - 18 + i * 16
        parts.append(checkbox(clx2, cy - 8, 9, stroke="#333"))
        parts.append(text(clx2 + 14, cy, lab, size=9))

    # ---------- footer ----------
    footer_h = 68
    fy = H - footer_h
    parts.append(f'<rect x="0" y="{fy}" width="{W}" height="{footer_h}" fill="{NAVY}"/>')
    # simple logo mark
    parts.append(f'<circle cx="46" cy="{fy+34}" r="19" fill="none" stroke="#4fd1e8" stroke-width="4"/>')
    parts.append(f'<circle cx="66" cy="{fy+34}" r="19" fill="none" stroke="#e8c34f" stroke-width="4"/>')
    parts.append(text(30, fy + 40, "bba", size=17, weight="bold", fill="white"))

    parts.append(text(100, fy + 30, d["company"]["phone"], size=17, weight="bold", fill="white"))
    parts.append(text(100, fy + 48, d["company"]["email"], size=9.5, fill="#cfe0f7"))

    ox = 640
    for name, line1, line2 in d["company"]["offices"]:
        parts.append(text(ox, fy + 20, name, size=9.5, weight="bold", fill="white"))
        parts.append(text(ox, fy + 33, line1, size=8, fill="#cfe0f7"))
        parts.append(text(ox, fy + 44, line2, size=8, fill="#cfe0f7"))
        ox += 160

    parts.append("</svg>")
    return "\n".join(parts)


def main():
    out_dir = os.path.join(os.path.dirname(__file__), "..")
    svg = build_svg(DATA)
    svg_path = os.path.join(out_dir, "proof.svg")
    with open(svg_path, "w") as f:
        f.write(svg)
    print(f"Wrote {svg_path}")

    html_doc = f"""<!doctype html>
<html><head><meta charset="utf-8"><style>
  html,body {{ margin:0; padding:0; }}
  svg {{ display:block; }}
</style></head>
<body>
{svg}
</body></html>
"""
    html_path = os.path.join(out_dir, "proof.html")
    with open(html_path, "w") as f:
        f.write(html_doc)
    print(f"Wrote {html_path}")


if __name__ == "__main__":
    main()
