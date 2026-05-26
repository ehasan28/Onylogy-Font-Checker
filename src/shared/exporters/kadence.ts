import type { HierarchyReport, HierarchyRole } from '../types';
import { round } from '../typography/parse';
import { rem, quoteIfNeeded, uniqueFamilies } from './css-vars';

/**
 * Approximate Kadence Theme typography option shape. Real Kadence uses a
 * `kadence_typography` option array with per-role keys; this export
 * structures the data so a Kadence developer can map it directly.
 */
export function exportKadence(report: HierarchyReport): string {
  const families = uniqueFamilies(report);
  const fontFamilyMap = Object.fromEntries(
    families.map((f) => [
      f.slug,
      {
        family: f.primary,
        fallback: f.fallback.map(quoteIfNeeded).join(', '),
        google: false,
      },
    ]),
  );

  const KADENCE_KEY: Partial<Record<HierarchyRole, string>> = {
    h1: 'heading_1',
    h2: 'heading_2',
    h3: 'heading_3',
    h4: 'heading_4',
    h5: 'heading_5',
    h6: 'heading_6',
    body: 'text',
    button: 'buttons',
    link: 'link',
    caption: 'caption',
    blockquote: 'blockquote',
  };

  const typography: Record<string, Record<string, unknown>> = {};
  for (const e of report.entries) {
    const key = KADENCE_KEY[e.role] ?? e.role;
    typography[key] = {
      family: e.family.primary,
      googleFont: false,
      weight: String(e.fontWeight),
      style: 'normal',
      transform: e.textTransform === 'none' ? '' : e.textTransform,
      size: { desktop: rem(e.fontSizePx), tablet: '', mobile: '' },
      sizeType: 'rem',
      lineHeight:
        e.lineHeightRatio != null
          ? { desktop: round(e.lineHeightRatio, 3), tablet: '', mobile: '' }
          : null,
      letterSpacing:
        e.letterSpacingEm !== 0
          ? { desktop: round(e.letterSpacingEm, 3), tablet: '', mobile: '' }
          : null,
      letterSpacingType: 'em',
    };
  }

  return JSON.stringify(
    {
      kadence_typography_options: {
        fontFamily: fontFamilyMap,
        typography,
      },
      _notes: 'Drop into Kadence Theme → Customize → Typography. Values map to Kadence-style settings.',
    },
    null,
    2,
  );
}
