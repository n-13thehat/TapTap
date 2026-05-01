#!/usr/bin/env node
/**
 * generate-pwa-icons.mjs
 *
 * Rasterizes the TapTap Matrix PWA icons from in-memory SVG templates to PNG
 * at every size declared in public/manifest.json, plus the root
 * /apple-touch-icon.png that iOS Safari requests directly.
 *
 * Run:  node scripts/generate-pwa-icons.mjs
 */
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "public");
const ICONS_DIR = path.join(ROOT, "icons");

// Manifest icon sizes + the apple-touch + maskable padding variants.
const SIZES = [72, 96, 128, 144, 152, 180, 192, 384, 512];

// Brand colours (match manifest theme_color + existing SVG gradient).
const BRAND_FROM = "#14b8a6"; // teal-500
const BRAND_TO = "#3b82f6"; // blue-500
const TEXT = "TM";

function brandSvg(size, { maskable = false } = {}) {
  // For maskable icons the safe zone is a circle of radius 0.4*size.
  // Keep glyph well inside that, so home-screen masks (iOS, Android) don't clip.
  const radius = maskable ? 0 : Math.round(size * 0.2);
  const fontSize = Math.round(size * (maskable ? 0.28 : 0.34));
  const safePadding = maskable ? Math.round(size * 0.08) : 0;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${BRAND_FROM}"/>
      <stop offset="100%" stop-color="${BRAND_TO}"/>
    </linearGradient>
  </defs>
  <rect x="${safePadding}" y="${safePadding}" width="${size - safePadding * 2}" height="${size - safePadding * 2}" rx="${radius}" fill="url(#g)"/>
  <text x="50%" y="50%" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="white" letter-spacing="-2">${TEXT}</text>
</svg>`;
}

async function renderPng(svgString, outPath) {
  const buf = await sharp(Buffer.from(svgString), { density: 384 })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(outPath, buf);
  return buf.length;
}

async function main() {
  await mkdir(ICONS_DIR, { recursive: true });
  let total = 0;
  const report = [];

  for (const size of SIZES) {
    // Standard "any" icon (rounded square).
    const stdPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
    const stdBytes = await renderPng(brandSvg(size), stdPath);
    report.push({ file: `icons/icon-${size}x${size}.png`, bytes: stdBytes });
    total += stdBytes;
  }

  // Apple touch icon. iOS Safari hits /apple-touch-icon.png at the host root
  // before falling back to a screenshot.
  const appleSvg = brandSvg(180);
  const appleRoot = path.join(ROOT, "apple-touch-icon.png");
  const appleIconsDir = path.join(ICONS_DIR, "apple-touch-icon.png");
  const aBytes1 = await renderPng(appleSvg, appleRoot);
  const aBytes2 = await renderPng(appleSvg, appleIconsDir);
  report.push({ file: "apple-touch-icon.png", bytes: aBytes1 });
  report.push({ file: "icons/apple-touch-icon.png", bytes: aBytes2 });
  total += aBytes1 + aBytes2;

  // Shortcut icons (96x96 each) - reuse the brand mark rather than the
  // empty placeholder shortcut SVGs.
  for (const slug of ["library", "discover", "beta", "social"]) {
    const out = path.join(ICONS_DIR, `shortcut-${slug}.png`);
    const b = await renderPng(brandSvg(96), out);
    report.push({ file: `icons/shortcut-${slug}.png`, bytes: b });
    total += b;
  }

  // Favicon at 32x32 (kept alongside the existing favicon.ico).
  const favPath = path.join(ROOT, "favicon-32x32.png");
  const favBytes = await renderPng(brandSvg(32), favPath);
  report.push({ file: "favicon-32x32.png", bytes: favBytes });
  total += favBytes;

  // eslint-disable-next-line no-console
  console.table(report);
  // eslint-disable-next-line no-console
  console.log(`\nWrote ${report.length} files, total ${(total / 1024).toFixed(1)} kB`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
