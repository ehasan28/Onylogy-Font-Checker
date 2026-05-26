import type { HierarchyReport } from '../types';
import { round } from '../typography/parse';

/**
 * Emit CSS variables under `:root` for each role + each detected font family.
 *
 *   :root {
 *     --font-family-sans: 'Inter', system-ui, sans-serif;
 *     --font-h1-size: 3rem;
 *     --font-h1-line-height: 1.1;
 *     --font-h1-weight: 700;
 *     --font-h1-letter-spacing: -0.02em;
 *     ...
 *   }
 */
export function exportCssVars(report: HierarchyReport): string {
  const lines: string[] = [];
  lines.push(':root {');

  // Font families (primary by family-key)
  const families = uniqueFamilies(report);
  for (const f of families) {
    const stack = [f.primary, ...f.fallback].map(quoteIfNeeded).join(', ');
    lines.push(`  --font-family-${f.slug}: ${stack};`);
  }
  if (families.length) lines.push('');

  // Per-role tokens
  for (const e of report.entries) {
    const r = e.role;
    lines.push(`  --font-${r}-size: ${rem(e.fontSizePx)};`);
    if (e.lineHeightRatio != null) {
      lines.push(`  --font-${r}-line-height: ${round(e.lineHeightRatio, 3)};`);
    }
    lines.push(`  --font-${r}-weight: ${e.fontWeight};`);
    if (e.letterSpacingEm !== 0) {
      lines.push(`  --font-${r}-letter-spacing: ${round(e.letterSpacingEm, 3)}em;`);
    }
    if (e.textTransform && e.textTransform !== 'none') {
      lines.push(`  --font-${r}-text-transform: ${e.textTransform};`);
    }
  }

  lines.push('}');
  return lines.join('\n');
}

/* ───────────────────────────  Helpers (shared)  ──────────────────────── */

export function rem(px: number, base = 16): string {
  return `${round(px / base, 4)}rem`;
}

export function quoteIfNeeded(family: string): string {
  if (!family) return '';
  if (/^[a-z][a-z0-9-]*$/i.test(family)) return family;
  if (family.includes(' ') || family.includes(',')) return `'${family}'`;
  return family;
}

export interface FamilyGroup {
  primary: string;
  fallback: string[];
  slug: string;
  generic: string | null;
}

export function uniqueFamilies(report: HierarchyReport): FamilyGroup[] {
  const seen = new Map<string, FamilyGroup>();
  for (const e of report.entries) {
    const primary = e.family.primary;
    if (!primary) continue;
    const key = primary.toLowerCase();
    if (seen.has(key)) continue;
    const slug = slugifyFamily(primary, e.family.generic);
    seen.set(key, {
      primary,
      fallback: [
        ...e.family.stack.filter((s) => s !== primary),
        ...(e.family.generic ? [e.family.generic] : []),
      ],
      slug,
      generic: e.family.generic,
    });
  }
  return Array.from(seen.values());
}

export function slugifyFamily(primary: string, generic: string | null): string {
  // Prefer a generic-based slug ("sans" / "serif" / "mono") when available;
  // otherwise slugify the primary family.
  if (generic) {
    if (generic.includes('mono')) return 'mono';
    if (generic.includes('serif') && !generic.includes('sans')) return 'serif';
    if (generic.includes('sans')) return 'sans';
  }
  return primary
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
