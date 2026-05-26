import {
  walkVisibleElements,
  getComputedStyleSafe,
  elementSelector,
  nextIdle,
} from './dom-walk';
import {
  parseFontFamily,
  parseLineHeight,
  parseLetterSpacing,
} from '../shared/typography/parse';
import { parseColor, rgbaToHex, compose } from '../shared/typography/convert';
import { detectScale } from '../shared/typography/scale';
import { detectFontSources } from './font-source-detector';
import type {
  FontUsage,
  HierarchyReport,
  HierarchyRole,
  ParsedFontFamily,
  RgbaColor,
  TypographyEntry,
} from '../shared/types';

/* ──────────────────────────  Role detection  ─────────────────────────── */

function roleForElement(el: Element, fontSizePx: number): HierarchyRole | null {
  const tag = el.tagName.toUpperCase();
  if (tag === 'H1') return 'h1';
  if (tag === 'H2') return 'h2';
  if (tag === 'H3') return 'h3';
  if (tag === 'H4') return 'h4';
  if (tag === 'H5') return 'h5';
  if (tag === 'H6') return 'h6';
  if (tag === 'BLOCKQUOTE') return 'blockquote';
  if (tag === 'BUTTON') return 'button';
  if (tag === 'A') return 'link';
  if (el.getAttribute('role') === 'button') return 'button';
  if (el.getAttribute('role') === 'link') return 'link';
  if (tag === 'FIGCAPTION' || tag === 'SMALL') return 'caption';

  // For generic p/span/div, classify by font size if it has direct text.
  if (!hasDirectText(el)) return null;
  if (fontSizePx <= 13) return 'caption';
  return 'body';
}

function hasDirectText(el: Element): boolean {
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      return true;
    }
  }
  return false;
}

/* ────────────────────────────  Extraction  ───────────────────────────── */

interface Sample {
  role: HierarchyRole;
  fontSizePx: number;
  fontWeight: number;
  family: ParsedFontFamily;
  lineHeightPx: number | null;
  lineHeightRatio: number | null;
  letterSpacingEm: number;
  textTransform: string;
  textAlign: string;
  color: string | null;
  effectiveBg: string | null;
  selector: string;
  sampleText: string;
}

export async function extractHierarchy(opts?: {
  minArea?: number;
}): Promise<HierarchyReport> {
  const start = performance.now();
  const minArea = opts?.minArea ?? 100;
  const samples: Sample[] = [];
  let scanned = 0;

  const collected: Element[] = [];
  scanned = await walkVisibleElements(
    document,
    (el) => {
      collected.push(el);
    },
    { minArea, visibleOnly: true },
  );

  // Chunk to keep the page responsive.
  for (let i = 0; i < collected.length; i++) {
    if (i > 0 && i % 200 === 0) await nextIdle();

    const el = collected[i];
    const style = getComputedStyleSafe(el);
    if (!style) continue;

    const fontSizePx = parseFloat(style.fontSize) || 0;
    if (fontSizePx <= 0) continue;

    const role = roleForElement(el, fontSizePx);
    if (!role) continue;

    const text = (el.textContent ?? '').trim();
    if (!text) continue;

    const lh = parseLineHeight(style.lineHeight, fontSizePx);
    const ls = parseLetterSpacing(style.letterSpacing, fontSizePx);
    const family = parseFontFamily(style.fontFamily);
    const weight = parseInt(style.fontWeight ?? '400', 10) || 400;

    const color = parseColor(style.color);
    const bg = walkEffectiveBackground(el);

    samples.push({
      role,
      fontSizePx,
      fontWeight: weight,
      family,
      lineHeightPx: lh.px,
      lineHeightRatio: lh.ratio,
      letterSpacingEm: ls.em,
      textTransform: style.textTransform || 'none',
      textAlign: style.textAlign || 'start',
      color: color ? rgbaToHex(color) : null,
      effectiveBg: bg ? rgbaToHex(bg) : null,
      selector: elementSelector(el),
      sampleText: text.replace(/\s+/g, ' ').slice(0, 60),
    });
  }

  // Group by role → mode aggregation.
  const byRole = new Map<HierarchyRole, Sample[]>();
  for (const s of samples) {
    const arr = byRole.get(s.role) ?? [];
    arr.push(s);
    byRole.set(s.role, arr);
  }

  const entries: TypographyEntry[] = [];
  for (const [role, arr] of byRole) {
    if (arr.length === 0) continue;
    entries.push(buildEntry(role, arr));
  }
  entries.sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role));

  // fontUsage map
  const fontUsage = buildFontUsage(samples);

  // Body font size as base for the scale, falling back to 16.
  const bodyEntry = entries.find((e) => e.role === 'body');
  const base = bodyEntry?.fontSizePx ?? 16;

  // Use ALL unique sizes from heading + body roles for scale detection.
  const sizesForScale = entries
    .filter((e) => e.role === 'body' || e.role.startsWith('h'))
    .map((e) => e.fontSizePx);
  const scale = detectScale(sizesForScale, base);

  // Font sources (asynchronous — wraps document.fonts + stylesheet scan)
  const families = Array.from(new Set(samples.map((s) => s.family.primary).filter(Boolean)));
  const fontSources = await detectFontSources(families);

  return {
    entries,
    scale,
    fontUsage,
    fontSources,
    scanned,
    elapsedMs: Math.round(performance.now() - start),
  };
}

const ROLE_ORDER: HierarchyRole[] = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'body',
  'blockquote',
  'button',
  'link',
  'caption',
];

function buildEntry(role: HierarchyRole, arr: Sample[]): TypographyEntry {
  const sizes = arr.map((s) => s.fontSizePx);
  const modeSize = mode(sizes);
  const matching = arr.filter((s) => Math.abs(s.fontSizePx - modeSize) < 0.5);

  const lhCandidates = matching
    .map((s) => s.lineHeightPx)
    .filter((v): v is number => v != null);
  const lhRatioCandidates = matching
    .map((s) => s.lineHeightRatio)
    .filter((v): v is number => v != null);

  const familyCandidates = matching.map((s) => s.family);
  const modeFamily = mostFrequent(familyCandidates, (f) => f.primary);

  const example = matching[0] ?? arr[0];

  return {
    role,
    selectorSample: example.selector,
    sampleText: example.sampleText,
    family: modeFamily,
    fontSizePx: round(modeSize, 2),
    fontSizeRange: [round(Math.min(...sizes), 2), round(Math.max(...sizes), 2)],
    lineHeightPx: lhCandidates.length ? round(mode(lhCandidates), 2) : null,
    lineHeightRatio: lhRatioCandidates.length ? round(mode(lhRatioCandidates), 3) : null,
    letterSpacingEm: round(mode(matching.map((s) => s.letterSpacingEm)), 3),
    fontWeight: mode(matching.map((s) => s.fontWeight)),
    textTransform: mostFrequent(matching, (s) => s.textTransform).textTransform,
    textAlign: mostFrequent(matching, (s) => s.textAlign).textAlign,
    occurrences: arr.length,
    color: mostFrequent(matching, (s) => s.color ?? '').color,
    effectiveBg: mostFrequent(matching, (s) => s.effectiveBg ?? '').effectiveBg,
  };
}

function buildFontUsage(samples: Sample[]): FontUsage[] {
  const map = new Map<string, FontUsage>();
  for (const s of samples) {
    const key = s.family.primary || s.family.generic || '(unknown)';
    const cur = map.get(key) ?? {
      family: key,
      count: 0,
      roles: [] as HierarchyRole[],
    };
    cur.count++;
    if (!cur.roles.includes(s.role)) cur.roles.push(s.role);
    map.set(key, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

/* ──────────────────────────  Utilities  ──────────────────────────────── */

function mode(nums: number[]): number {
  if (nums.length === 0) return 0;
  const counts = new Map<number, number>();
  for (const n of nums) counts.set(n, (counts.get(n) ?? 0) + 1);
  let best = nums[0];
  let bestCount = 0;
  for (const [k, v] of counts) {
    if (v > bestCount) {
      bestCount = v;
      best = k;
    }
  }
  return best;
}

function mostFrequent<T>(items: T[], key: (item: T) => string): T {
  if (items.length === 0) throw new Error('empty');
  const counts = new Map<string, { item: T; count: number }>();
  for (const it of items) {
    const k = key(it);
    const cur = counts.get(k) ?? { item: it, count: 0 };
    cur.count++;
    counts.set(k, cur);
  }
  let best = items[0];
  let bestCount = 0;
  for (const { item, count } of counts.values()) {
    if (count > bestCount) {
      best = item;
      bestCount = count;
    }
  }
  return best;
}

function round(n: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

function walkEffectiveBackground(el: Element): RgbaColor | null {
  let composed: RgbaColor | null = null;
  let cur: Element | null = el;
  let safety = 0;
  while (cur && safety < 30) {
    safety++;
    const style = getComputedStyleSafe(cur);
    const bg = style ? parseColor(style.backgroundColor) : null;
    if (bg && bg.a > 0) {
      composed = composed ? compose(composed, bg) : bg;
      if (composed.a >= 0.999) return composed;
    }
    cur = cur.parentElement;
  }
  if (composed) return compose(composed, { r: 255, g: 255, b: 255, a: 1 });
  return { r: 255, g: 255, b: 255, a: 1 };
}
