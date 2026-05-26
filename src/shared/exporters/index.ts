import type { ExportFormat, HierarchyReport } from '../types';
import { exportCssVars } from './css-vars';
import { exportTailwind } from './tailwind';
import { exportScss } from './scss';
import { exportJson } from './json';
import { exportKadence } from './kadence';
import { exportClamp } from './clamp';

/**
 * Dispatcher for typography exporters. Each format is a pure function from
 * `HierarchyReport → string`. The Export tab routes through this.
 */
export function exportTypography(
  format: ExportFormat,
  report: HierarchyReport,
): string {
  switch (format) {
    case 'css-vars':
      return exportCssVars(report);
    case 'tailwind':
      return exportTailwind(report);
    case 'scss':
      return exportScss(report);
    case 'json':
      return exportJson(report);
    case 'kadence':
      return exportKadence(report);
    case 'clamp':
      return exportClamp(report);
  }
}

export const EXPORT_FORMATS: { value: ExportFormat; label: string; lang: string }[] = [
  { value: 'css-vars', label: 'CSS Vars', lang: 'css' },
  { value: 'tailwind', label: 'Tailwind', lang: 'js' },
  { value: 'scss', label: 'SCSS', lang: 'scss' },
  { value: 'json', label: 'JSON', lang: 'json' },
  { value: 'kadence', label: 'Kadence', lang: 'json' },
  { value: 'clamp', label: 'clamp()', lang: 'css' },
];
