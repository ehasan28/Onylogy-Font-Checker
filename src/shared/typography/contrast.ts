import type { RgbaColor } from '../types';

function srgbToLin(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(c: RgbaColor): number {
  return (
    0.2126 * srgbToLin(c.r) +
    0.7152 * srgbToLin(c.g) +
    0.0722 * srgbToLin(c.b)
  );
}

export function contrastRatio(a: RgbaColor, b: RgbaColor): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const light = Math.max(la, lb);
  const dark = Math.min(la, lb);
  return (light + 0.05) / (dark + 0.05);
}

export interface WcagBadges {
  ratio: number;
  aaNormal: boolean;
  aaLarge: boolean;
  aaaNormal: boolean;
  aaaLarge: boolean;
}

export function wcagBadges(ratio: number): WcagBadges {
  return {
    ratio: Math.round(ratio * 100) / 100,
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaaNormal: ratio >= 7,
    aaaLarge: ratio >= 4.5,
  };
}
