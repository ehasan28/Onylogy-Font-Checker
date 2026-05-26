import type { HierarchyReport } from '../types';
import { round } from '../typography/parse';
import { rem, quoteIfNeeded, uniqueFamilies } from './css-vars';

/**
 * Tailwind config snippet — uses the tuple shorthand for fontSize so each
 * role carries its line-height + font-weight + letter-spacing.
 */
export function exportTailwind(report: HierarchyReport): string {
  const families = uniqueFamilies(report);

  const familyLines: string[] = [];
  for (const f of families) {
    const stack = [f.primary, ...f.fallback].map(quoteIfNeeded);
    familyLines.push(`        ${f.slug}: [${stack.map((s) => `'${s}'`).join(', ')}],`);
  }

  const sizeLines: string[] = [];
  for (const e of report.entries) {
    const props: string[] = [];
    if (e.lineHeightRatio != null) {
      props.push(`lineHeight: '${round(e.lineHeightRatio, 3)}'`);
    }
    if (e.fontWeight !== 400) {
      props.push(`fontWeight: '${e.fontWeight}'`);
    }
    if (e.letterSpacingEm !== 0) {
      props.push(`letterSpacing: '${round(e.letterSpacingEm, 3)}em'`);
    }
    const meta = props.length ? `, { ${props.join(', ')} }` : '';
    sizeLines.push(`        ${e.role}: ['${rem(e.fontSizePx)}'${meta}],`);
  }

  return [
    '/** @type {import("tailwindcss").Config} */',
    'module.exports = {',
    '  theme: {',
    '    extend: {',
    '      fontFamily: {',
    ...familyLines,
    '      },',
    '      fontSize: {',
    ...sizeLines,
    '      },',
    '    },',
    '  },',
    '};',
  ].join('\n');
}
