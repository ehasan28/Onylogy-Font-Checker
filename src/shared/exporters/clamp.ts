import type { HierarchyReport } from '../types';
import { round } from '../typography/parse';

/**
 * Responsive clamp() typography system.
 *
 * Approximates each role's responsive sizing as a linear interpolation
 * between 320px viewport and 1440px viewport. Mobile size = px * 0.75 by
 * default, desktop size = role's mode size. If a role has an observed range
 * (`fontSizeRange`) we use [min, max] as a more accurate basis.
 */
const VIEWPORT_MIN = 320;
const VIEWPORT_MAX = 1440;
const BASE_REM = 16;

export function exportClamp(report: HierarchyReport): string {
  const lines: string[] = [];
  lines.push(':root {');

  for (const e of report.entries) {
    const [observedMin, observedMax] = e.fontSizeRange;
    // If the observed range is tight, scale the mode by 0.75/1.0 as a safe default.
    const tight = observedMax - observedMin < 1;
    const minPx = tight ? Math.round(e.fontSizePx * 0.75) : observedMin;
    const maxPx = tight ? Math.round(e.fontSizePx) : observedMax;

    const slope = (maxPx - minPx) / (VIEWPORT_MAX - VIEWPORT_MIN);
    const yAxisPx = minPx - slope * VIEWPORT_MIN;
    const yAxisRem = yAxisPx / BASE_REM;
    const vw = slope * 100;

    const minRem = round(minPx / BASE_REM, 3);
    const maxRem = round(maxPx / BASE_REM, 3);
    const preferred = `${round(yAxisRem, 3)}rem + ${round(vw, 3)}vw`;

    lines.push(
      `  --font-${e.role}-size: clamp(${minRem}rem, ${preferred}, ${maxRem}rem);`,
    );
  }

  lines.push('}');
  lines.push('');
  lines.push(
    '/* Interpolates each role between 320px and 1440px viewport widths. */',
  );
  return lines.join('\n');
}
