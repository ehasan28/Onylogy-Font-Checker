import type { RgbaColor } from '../types';

/**
 * Slim color parser/serializer — only what we need for typography contrast.
 * No culori dependency: supports hex (#rgb/#rgba/#rrggbb/#rrggbbaa), rgb(),
 * rgba(), hsl(), hsla(), and the common CSS named colors that show up in
 * computed styles ("transparent", "currentcolor" → null).
 */

export function parseColor(input: string | null | undefined): RgbaColor | null {
  if (!input) return null;
  const raw = input.trim().toLowerCase();
  if (!raw || raw === 'transparent' || raw === 'currentcolor' || raw === 'inherit') {
    if (raw === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
    return null;
  }

  if (raw[0] === '#') return parseHex(raw);

  const fnMatch = raw.match(/^(rgba?|hsla?)\s*\(([^)]+)\)$/);
  if (fnMatch) {
    const fn = fnMatch[1];
    const parts = fnMatch[2]
      .split(/[\s,/]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (fn.startsWith('rgb')) return parseRgbParts(parts);
    if (fn.startsWith('hsl')) return parseHslParts(parts);
  }

  // Named colors — small lookup table for the common ones in computed styles.
  const named = NAMED_COLORS[raw];
  if (named) return parseHex(named);

  return null;
}

function parseHex(hex: string): RgbaColor | null {
  let s = hex.replace(/^#/, '');
  if (s.length === 3 || s.length === 4) {
    s = s
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (s.length !== 6 && s.length !== 8) return null;
  const r = parseInt(s.slice(0, 2), 16);
  const g = parseInt(s.slice(2, 4), 16);
  const b = parseInt(s.slice(4, 6), 16);
  const a = s.length === 8 ? parseInt(s.slice(6, 8), 16) / 255 : 1;
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return { r, g, b, a };
}

function parseRgbParts(parts: string[]): RgbaColor | null {
  if (parts.length < 3) return null;
  const r = parseChannel(parts[0]);
  const g = parseChannel(parts[1]);
  const b = parseChannel(parts[2]);
  const a = parts[3] != null ? parseAlpha(parts[3]) : 1;
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return { r, g, b, a };
}

function parseChannel(s: string): number {
  if (s.endsWith('%')) return Math.round((parseFloat(s) / 100) * 255);
  return Math.round(parseFloat(s));
}

function parseAlpha(s: string): number {
  if (s.endsWith('%')) return parseFloat(s) / 100;
  return parseFloat(s);
}

function parseHslParts(parts: string[]): RgbaColor | null {
  if (parts.length < 3) return null;
  const h = parseFloat(parts[0]);
  const sPct = parseFloat(parts[1]) / 100;
  const lPct = parseFloat(parts[2]) / 100;
  const a = parts[3] != null ? parseAlpha(parts[3]) : 1;
  if ([h, sPct, lPct].some((n) => Number.isNaN(n))) return null;
  const { r, g, b } = hslToRgb(h, sPct, lPct);
  return { r, g, b, a };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r1 = 0, g1 = 0, b1 = 0;
  if (h < 60) [r1, g1, b1] = [c, x, 0];
  else if (h < 120) [r1, g1, b1] = [x, c, 0];
  else if (h < 180) [r1, g1, b1] = [0, c, x];
  else if (h < 240) [r1, g1, b1] = [0, x, c];
  else if (h < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

export function rgbaToHex(rgba: RgbaColor): string {
  const r = clampByte(rgba.r).toString(16).padStart(2, '0');
  const g = clampByte(rgba.g).toString(16).padStart(2, '0');
  const b = clampByte(rgba.b).toString(16).padStart(2, '0');
  if (rgba.a < 1) {
    const a = clampByte(Math.round(rgba.a * 255)).toString(16).padStart(2, '0');
    return `#${r}${g}${b}${a}`;
  }
  return `#${r}${g}${b}`;
}

function clampByte(n: number): number {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 255) return 255;
  return Math.round(n);
}

/**
 * Composite a (possibly translucent) foreground over a background to compute
 * the effective opaque color. Used for contrast when an element's color has
 * alpha < 1.
 */
export function compose(fg: RgbaColor, bg: RgbaColor): RgbaColor {
  const a = fg.a + bg.a * (1 - fg.a);
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
  const r = (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a;
  const g = (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a;
  const b = (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a;
  return { r, g, b, a };
}

const NAMED_COLORS: Record<string, string> = {
  black: '#000000',
  white: '#ffffff',
  red: '#ff0000',
  green: '#008000',
  blue: '#0000ff',
  gray: '#808080',
  grey: '#808080',
  silver: '#c0c0c0',
  maroon: '#800000',
  yellow: '#ffff00',
  olive: '#808000',
  lime: '#00ff00',
  aqua: '#00ffff',
  cyan: '#00ffff',
  teal: '#008080',
  navy: '#000080',
  fuchsia: '#ff00ff',
  magenta: '#ff00ff',
  purple: '#800080',
};
