#!/usr/bin/env node
/**
 * Toolbar icon generator.
 *
 * Per Ehasanul's spec (v0.2.0+): a styled "Aa" wordmark in the brand
 * blue (#004BD1) on a fully transparent background. Sharp's PNG encoder
 * preserves alpha, so the icon renders as just the glyphs over whatever
 * Chrome paints behind it (light or dark toolbar).
 *
 * Glyph treatment:
 *   - Capital "A" rendered in a display serif (Bricolage Grotesque feel,
 *     falling back through several display faces so something renders
 *     correctly regardless of which fonts are installed at icon-gen time).
 *   - Lowercase "a" rendered in a heavier sans (Montserrat-like).
 *   - Both glyphs at brand blue #004BD1.
 *   - Generous SVG canvas (256×256) downscaled by sharp for crisp edges
 *     at 16/32/48/96/128.
 */

import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '..', 'public', 'icon');
const SIZES = [16, 32, 48, 96, 128];

const BRAND = '#004BD1';

// 256×256 canvas with the "Aa" centered. Pure transparent background.
// Glyphs are positioned so visual weight balances around the canvas center
// even at very small render sizes (16×16).
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <!-- Capital A in a display serif. The italic + serif feel echoes
       Bricolage Grotesque's display variant. -->
  <text
    x="40"
    y="200"
    font-family="'Bricolage Grotesque', 'Instrument Serif', 'EB Garamond', Georgia, serif"
    font-size="220"
    font-weight="600"
    fill="${BRAND}"
  >A</text>

  <!-- Lowercase a in a sans, slightly smaller, baseline-aligned. -->
  <text
    x="148"
    y="200"
    font-family="'Montserrat', 'Inter', system-ui, sans-serif"
    font-size="170"
    font-weight="600"
    fill="${BRAND}"
  >a</text>
</svg>
`.trim();

await mkdir(OUT_DIR, { recursive: true });

for (const size of SIZES) {
  const out = resolve(OUT_DIR, `${size}.png`);
  await sharp(Buffer.from(svg))
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }, // explicit transparent
    })
    .png({ compressionLevel: 9, palette: false })
    .toFile(out);
  console.log(`✓ ${size}.png`);
}

console.log('Icons regenerated (brand-blue Aa on transparent).');
