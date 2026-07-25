// Renders proof.html (the SVG proof, wrapped in a minimal HTML shell) to a
// pixel-accurate PDF using the pre-installed headless Chromium.
//
// Usage: node scripts/render_pdf.js
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..");
const HTML_PATH = path.join(ROOT, "proof.html");
const PDF_PATH = path.join(ROOT, "output", "proof.pdf");
const PNG_PATH = path.join(ROOT, "output", "proof.png");

// Must match the width/height set in generate_svg.py (A4 landscape @96dpi)
const WIDTH_PX = 1122;
const HEIGHT_PX = 793;

async function main() {
  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium",
  });
  const page = await browser.newPage({
    viewport: { width: WIDTH_PX, height: HEIGHT_PX },
  });
  await page.goto("file://" + HTML_PATH);

  await page.screenshot({ path: PNG_PATH });

  await page.pdf({
    path: PDF_PATH,
    width: `${WIDTH_PX}px`,
    height: `${HEIGHT_PX}px`,
    printBackground: true,
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  await browser.close();
  console.log("Wrote", PDF_PATH);
  console.log("Wrote", PNG_PATH);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
