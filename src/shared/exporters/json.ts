import type { HierarchyReport } from '../types';
import { round } from '../typography/parse';
import { rem, uniqueFamilies } from './css-vars';

/**
 * Design-token-friendly nested JSON. Compatible with most "design tokens"
 * pipelines (Style Dictionary, Theo, etc.) at a basic structural level.
 */
export function exportJson(report: HierarchyReport): string {
  const families = uniqueFamilies(report);

  const fontFamily: Record<string, string[]> = {};
  for (const f of families) {
    fontFamily[f.slug] = [f.primary, ...f.fallback];
  }

  const typography: Record<string, Record<string, unknown>> = {};
  for (const e of report.entries) {
    const entry: Record<string, unknown> = {
      fontSize: rem(e.fontSizePx),
      fontWeight: e.fontWeight,
    };
    if (e.family.primary) entry.fontFamily = e.family.primary;
    if (e.lineHeightRatio != null) entry.lineHeight = round(e.lineHeightRatio, 3);
    if (e.letterSpacingEm !== 0) {
      entry.letterSpacing = `${round(e.letterSpacingEm, 3)}em`;
    }
    if (e.textTransform && e.textTransform !== 'none') {
      entry.textTransform = e.textTransform;
    }
    typography[e.role] = entry;
  }

  const out = {
    fontFamily,
    typography,
    scale: {
      ratio: report.scale.ratio,
      name: report.scale.ratioName,
      base: rem(report.scale.base),
      confidence: report.scale.confidence,
    },
  };

  return JSON.stringify(out, null, 2);
}
