/**
 * Readability thresholds used by the accessibility analyzer.
 * Based on widely-cited typographic baselines:
 *   - Material Design: 16px minimum body font
 *   - WCAG 2.1 + Butterick: ~45-75 chars per line
 *   - Robert Bringhurst, "The Elements of Typographic Style": 1.5+ line height
 */

export const MIN_BODY_PX = 16;
export const MIN_CAPTION_PX = 12;

export const MIN_BODY_LINE_HEIGHT = 1.4;
export const IDEAL_BODY_LINE_HEIGHT = 1.5;

export const MIN_LINE_LENGTH = 45;
export const MAX_LINE_LENGTH = 75;
export const HARD_MAX_LINE_LENGTH = 90;

export const MIN_UPPERCASE_LETTER_SPACING_EM = 0.05;

/**
 * Approximate average glyph advance width as a fraction of the font size.
 * Tuned to common Western typefaces — accurate enough for thresholding.
 */
export function avgGlyphWidthFactor(family: string): number {
  const lower = family.toLowerCase();
  if (
    lower.includes('mono') ||
    lower.includes('courier') ||
    lower.includes('consolas') ||
    lower.includes('menlo') ||
    lower.includes('code')
  )
    return 0.6;
  if (
    lower.includes('serif') ||
    lower.includes('georgia') ||
    lower.includes('times') ||
    lower.includes('garamond') ||
    lower.includes('cambria')
  )
    return 0.48;
  // sans-serif default
  return 0.5;
}

/**
 * Estimated characters per line given container width and font.
 */
export function charsPerLine(
  containerWidthPx: number,
  fontSizePx: number,
  family: string,
): number {
  if (containerWidthPx <= 0 || fontSizePx <= 0) return 0;
  const avg = avgGlyphWidthFactor(family) * fontSizePx;
  if (avg <= 0) return 0;
  return Math.round(containerWidthPx / avg);
}

export interface MeasureCheck {
  chars: number;
  status: 'short' | 'ideal' | 'long' | 'too-long';
}

export function checkMeasure(chars: number): MeasureCheck {
  if (chars < MIN_LINE_LENGTH) return { chars, status: 'short' };
  if (chars > HARD_MAX_LINE_LENGTH) return { chars, status: 'too-long' };
  if (chars > MAX_LINE_LENGTH) return { chars, status: 'long' };
  return { chars, status: 'ideal' };
}
