import { getComputedStyleSafe } from './dom-walk';
import type { FontAxis, FontSource, FontSourceInfo } from '../shared/types';

/**
 * Hybrid font source detection.
 *
 * Three signals merged into one verdict per family:
 *   (a) FontFaceSet — `document.fonts` iteration gives us loaded fonts + axes.
 *   (b) Stylesheet scan — `@font-face` rules expose `src` URLs we classify
 *       (google / adobe / self-hosted / unknown).
 *   (c) Computed font-family chain — extracts fallback ordering and detects
 *       generic system fonts.
 *
 * Cross-origin stylesheets throw SecurityError when accessed via `cssRules`;
 * we wrap each sheet in try/catch and silently skip the unreadable ones.
 */

export async function detectFontSources(
  families: string[],
): Promise<FontSourceInfo[]> {
  const faces = readFontFaceSet();
  const sheetData = readStylesheets();

  const out: FontSourceInfo[] = [];
  for (const family of families) {
    if (!family) continue;
    const key = family.toLowerCase();

    const matchingFaces = faces.filter((f) => f.family.toLowerCase() === key);
    const matchingSheet = sheetData.get(key);

    const urls = matchingSheet?.urls ?? [];
    const source = classifySource(urls, family);
    const weights = matchingSheet?.weights ?? [];

    const axes: FontAxis[] = matchingFaces
      .flatMap((f) => f.axes ?? [])
      .filter(uniqueByTag);

    const variable =
      axes.length > 0 || matchingFaces.some((f) => f.variable);

    const loaded = matchingFaces.some((f) => f.loaded);

    out.push({
      family,
      source,
      urls,
      loaded,
      variable,
      axes,
      weights,
      fallbackStack: [], // filled by caller when needed
    });
  }
  return out;
}

/* ─────────────────────────  FontFaceSet probe  ───────────────────────── */

interface ProbedFace {
  family: string;
  weight: string;
  style: string;
  loaded: boolean;
  variable: boolean;
  axes: FontAxis[];
}

function readFontFaceSet(): ProbedFace[] {
  if (typeof document === 'undefined' || !document.fonts) return [];
  const out: ProbedFace[] = [];
  // FontFaceSet is iterable.
  for (const face of Array.from(document.fonts as unknown as Iterable<FontFace>)) {
    const family = stripQuotes(face.family ?? '');
    const axes = readAxes(face);
    out.push({
      family,
      weight: face.weight,
      style: face.style,
      loaded: face.status === 'loaded',
      variable: axes.length > 0,
      axes,
    });
  }
  return out;
}

function readAxes(face: FontFace): FontAxis[] {
  // FontFace `variationSettings` and per-axis ranges aren't standardized
  // across browsers. We try a best-effort detection via internal fields and
  // the `weight`/`stretch` properties (which can be ranges like "100 900").
  const axes: FontAxis[] = [];
  const w = parseRange(face.weight);
  if (w && w.min !== w.max) {
    axes.push({ tag: 'wght', min: w.min, max: w.max, default: w.min });
  }
  const stretch = parseRange(face.stretch ?? '');
  if (stretch && stretch.min !== stretch.max) {
    axes.push({ tag: 'wdth', min: stretch.min, max: stretch.max, default: stretch.min });
  }
  return axes;
}

function parseRange(v: string): { min: number; max: number } | null {
  if (!v) return null;
  const parts = v.split(/\s+/).map((p) => parseFloat(p));
  if (parts.length === 1 && Number.isFinite(parts[0])) {
    return { min: parts[0], max: parts[0] };
  }
  if (parts.length >= 2 && parts.every(Number.isFinite)) {
    return { min: parts[0], max: parts[1] };
  }
  return null;
}

/* ─────────────────────────  Stylesheet scan  ─────────────────────────── */

interface SheetEntry {
  urls: string[];
  weights: number[];
}

function readStylesheets(): Map<string, SheetEntry> {
  const out = new Map<string, SheetEntry>();
  if (typeof document === 'undefined') return out;

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList | null = null;
    try {
      rules = sheet.cssRules;
    } catch {
      // CORS-blocked stylesheet — skip silently.
      continue;
    }
    if (!rules) continue;
    for (const rule of Array.from(rules)) {
      visitRule(rule, out);
    }
    // Some Google Fonts CSS uses `@import` chains — the import target's
    // own sheet is exposed as a sibling sheet on document.styleSheets so we
    // don't need to recurse manually.
  }
  return out;
}

function visitRule(rule: CSSRule, out: Map<string, SheetEntry>): void {
  if (rule.type === CSSRule.FONT_FACE_RULE) {
    const r = rule as CSSFontFaceRule;
    const family = stripQuotes(r.style.getPropertyValue('font-family') ?? '');
    if (!family) return;
    const src = r.style.getPropertyValue('src') ?? '';
    const weight = r.style.getPropertyValue('font-weight') ?? '';
    const urls = extractUrls(src);
    const numericWeight = parseInt(weight, 10);
    const entry = out.get(family.toLowerCase()) ?? { urls: [], weights: [] };
    entry.urls.push(...urls);
    if (Number.isFinite(numericWeight)) entry.weights.push(numericWeight);
    out.set(family.toLowerCase(), entry);
    return;
  }

  // Recurse into grouping rules (e.g. @media, @supports).
  if ('cssRules' in rule) {
    const grouping = rule as CSSRule & { cssRules?: CSSRuleList };
    if (grouping.cssRules) {
      for (const r of Array.from(grouping.cssRules)) visitRule(r, out);
    }
  }
}

function extractUrls(src: string): string[] {
  const re = /url\(\s*(["']?)([^"')]+)\1\s*\)/gi;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    out.push(m[2]);
  }
  return out;
}

/* ──────────────────────────  Classification  ─────────────────────────── */

export function classifySource(urls: string[], family: string): FontSource {
  if (urls.length === 0) {
    if (SYSTEM_FONT_SET.has(family.toLowerCase())) return 'system';
    // Many sites use a known font without an inline @font-face (e.g. fonts
    // loaded via the Adobe/Google `<link rel="stylesheet">` whose CSS isn't
    // readable due to CORS). Fall back to 'unknown' so the UI can suggest.
    return 'unknown';
  }
  for (const u of urls) {
    const lower = u.toLowerCase();
    if (lower.includes('fonts.googleapis.com') || lower.includes('fonts.gstatic.com'))
      return 'google';
    if (lower.includes('use.typekit.net') || lower.includes('use.typekit.com'))
      return 'adobe';
  }
  // If every URL is same-origin (no protocol, or matches current origin) we
  // treat it as self-hosted.
  const allSelf = urls.every((u) => {
    if (u.startsWith('data:')) return true;
    if (!/^https?:\/\//i.test(u)) return true;
    try {
      const url = new URL(u, document.baseURI);
      return url.origin === location.origin;
    } catch {
      return false;
    }
  });
  if (allSelf) return 'self-hosted';
  return 'unknown';
}

export const SYSTEM_FONT_SET = new Set([
  'arial',
  'helvetica',
  'helvetica neue',
  'times',
  'times new roman',
  'courier',
  'courier new',
  'georgia',
  'verdana',
  'tahoma',
  'trebuchet ms',
  'impact',
  'comic sans ms',
  '-apple-system',
  'blinkmacsystemfont',
  'segoe ui',
  'roboto',
  'oxygen',
  'ubuntu',
  'cantarell',
  'sans-serif',
  'serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'ui-sans-serif',
  'ui-serif',
  'ui-monospace',
  'ui-rounded',
]);

/* ──────────────────────────  Page-context probe ──────────────────────── */

/**
 * Quickly inspect element references back to the page to determine if the
 * font-variation-settings is in use anywhere. Used as a hint for "variable: true".
 */
export function pageUsesVariableSettings(family: string): boolean {
  if (typeof document === 'undefined') return false;
  const elements = document.body?.querySelectorAll('*') ?? [];
  for (const el of Array.from(elements).slice(0, 2000)) {
    const style = getComputedStyleSafe(el);
    if (!style) continue;
    if (
      style.fontFamily?.toLowerCase().includes(family.toLowerCase()) &&
      style.fontVariationSettings &&
      style.fontVariationSettings !== 'normal'
    ) {
      return true;
    }
  }
  return false;
}

/* ────────────────────────────  Helpers  ─────────────────────────────── */

function stripQuotes(s: string): string {
  const t = s.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1);
  }
  return t;
}

function uniqueByTag(axis: FontAxis, i: number, arr: FontAxis[]): boolean {
  return arr.findIndex((a) => a.tag === axis.tag) === i;
}
