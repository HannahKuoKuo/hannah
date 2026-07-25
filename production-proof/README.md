# Production Proof Generator

Generates a Big Banner-style "production proof" document (warning box,
please-check checklist, job-approval box, front/back side artwork grid,
product spec block, production-use-only sign-off, company footer) from
plain data — no Adobe Illustrator installation required to produce it,
though the output SVG can be opened and hand-tweaked in Illustrator.

## Why this approach

Illustrator is a licensed desktop GUI app and can't run inside this
cloud environment. Instead, the proof is built as **SVG** (a vector
format Illustrator opens natively) and rendered to a print-ready
**PDF** using the pre-installed headless Chromium — so you get both a
client-ready PDF and an editable vector file from one source.

## Files

- `scripts/generate_svg.py` — builds `proof.svg` / `proof.html` from
  the `DATA` dict at the top of the file (order info, checklist state,
  artwork panels, product spec, footer contact details).
- `scripts/render_pdf.js` — opens `proof.html` in headless Chromium and
  exports `output/proof.pdf` (and a `proof.png` preview) at A4
  landscape, 1122×793px / 96dpi.
- `proof.svg` — the editable vector artwork (open directly in
  Illustrator).
- `output/proof.pdf`, `output/proof.png` — generated outputs.

## Regenerating

```bash
# 1. Edit the DATA dict in scripts/generate_svg.py with the new order's
#    invoice number, sales person, checklist, artwork captions, product
#    spec, qty, print side, and footer info.
python3 scripts/generate_svg.py

# 2. Render to PDF + PNG preview
NODE_PATH="$(npm root -g)" node scripts/render_pdf.js
```

Outputs land in `output/proof.pdf` and `output/proof.png`.

## Current state

`DATA` currently holds the sample "Bounce Coffee Co." cafe-barrier
order used as the layout reference (invoice 38594). The artwork panels
are placeholders (text label instead of the actual coffee-bean/logo
artwork and product photos) since real client artwork/photos weren't
provided yet.

## Next steps (not yet built — confirm before implementing)

This is deliberately just the one worked example first. Once the
layout is approved, decide how future orders should feed in data:

- **Config file per order** (JSON/YAML) + re-run the two scripts —
  fastest to build, good for one person running it locally.
- **Web form** — upload artwork images, fill in fields, click generate
  — more setup work, easier for non-technical use / multiple people.
- **Real artwork/photos** — swap the placeholder rectangles for actual
  `<image>` embeds once client files are available (SVG supports
  embedding raster images directly, so this is a small change to
  `generate_svg.py`).
