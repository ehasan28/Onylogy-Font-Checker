/**
 * Core domain types for Typography Inspector.
 *
 * Naming convention: anything containing pixel values is suffixed `Px`,
 * anything in em is `Em`, anything in rem is `Rem`. Raw computed-style
 * strings keep the `Raw` suffix so call sites can decide how to render them.
 */

/* ───────────────────────────  Colors (slim)  ─────────────────────────── */

export interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

/* ─────────────────────────  Units and exports  ───────────────────────── */

export type SizeUnit = 'px' | 'rem' | 'em';

export type ExportFormat =
  | 'css-vars'
  | 'tailwind'
  | 'scss'
  | 'json'
  | 'kadence'
  | 'clamp';

/* ───────────────────────────  Font sources  ──────────────────────────── */

export type FontSource =
  | 'google'
  | 'adobe'
  | 'self-hosted'
  | 'system'
  | 'unknown';

export interface FontAxis {
  tag: string;          // e.g. 'wght', 'wdth', 'opsz', 'slnt'
  min: number;
  max: number;
  default: number;
}

export interface FontSourceInfo {
  family: string;       // primary family name (sans quotes)
  source: FontSource;
  urls: string[];       // src URLs found in @font-face declarations
  loaded: boolean;      // document.fonts.check resolves true
  variable: boolean;
  axes: FontAxis[];
  weights: number[];    // numeric weights observed in stylesheets
  fallbackStack: string[];
}

export interface ParsedFontFamily {
  raw: string;           // computed font-family string, untouched
  primary: string;       // first family name, stripped of quotes
  stack: string[];       // ordered family list (without generic, if separated)
  generic: string | null; // 'sans-serif' | 'serif' | 'monospace' | 'cursive' | 'fantasy' | 'system-ui' | …
}

/* ─────────────────────────  Element typography  ──────────────────────── */

export interface ElementTypography {
  selector: string;
  tag: string;
  rect: { x: number; y: number; width: number; height: number };

  family: ParsedFontFamily;

  fontSizePx: number;
  fontSizeRaw: string;        // computed style verbatim, e.g. "16px"
  lineHeightPx: number | null;     // null when "normal"
  lineHeightRatio: number | null;  // px/fontSize, useful for clamp + a11y

  letterSpacingPx: number;
  letterSpacingEm: number;

  fontWeight: number;        // 100..900
  fontStyle: string;         // normal | italic | oblique
  fontStretch: string;       // normal | <percentage> | condensed | expanded | etc.

  textTransform: string;     // none | uppercase | lowercase | capitalize | full-width
  textAlign: string;         // start | end | left | right | center | justify
  textDecoration: string;    // shorthand: line color style thickness

  fontVariationSettings: string | null; // e.g. '"wght" 600, "wdth" 100'

  color: string | null;        // hex
  effectiveBg: string | null;  // hex, for contrast (walks ancestors)

  sampleText: string;        // first ~80 chars of trimmed textContent
}

/* ─────────────────────────  Hierarchy report  ────────────────────────── */

export type HierarchyRole =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'body'
  | 'caption'
  | 'button'
  | 'link'
  | 'blockquote';

export interface TypographyEntry {
  role: HierarchyRole;
  selectorSample: string;
  sampleText: string;

  family: ParsedFontFamily;
  fontSizePx: number;        // mode (most-frequent) size for the role
  fontSizeRange: [number, number]; // [min, max] observed for the role
  lineHeightPx: number | null;
  lineHeightRatio: number | null;
  letterSpacingEm: number;
  fontWeight: number;
  textTransform: string;
  textAlign: string;
  occurrences: number;
  color: string | null;
  effectiveBg: string | null;
}

export interface ScaleAnalysis {
  ratio: number | null;       // e.g. 1.25 (major third)
  ratioName: string | null;   // 'major-third', 'perfect-fourth', ...
  base: number;               // body font px
  confidence: 'high' | 'medium' | 'low';
  observed: number[];         // sorted unique sizes (px), >= 12
}

export interface FontUsage {
  family: string;
  count: number;
  roles: HierarchyRole[];
}

export interface HierarchyReport {
  entries: TypographyEntry[];
  scale: ScaleAnalysis;
  fontUsage: FontUsage[];
  fontSources: FontSourceInfo[];
  scanned: number;
  elapsedMs: number;
}

/* ───────────────────────────  Accessibility  ─────────────────────────── */

export type A11ySeverity = 'error' | 'warning' | 'info';

export type A11yCheckId =
  | 'body-too-small'
  | 'caption-too-small'
  | 'line-height-too-tight'
  | 'line-length-too-long'
  | 'line-length-too-short'
  | 'letter-spacing-uppercase'
  | 'low-contrast'
  | 'thin-weight-small-size';

export interface A11yTypographyIssue {
  id: A11yCheckId;
  severity: A11ySeverity;
  role: HierarchyRole;
  message: string;
  suggestion: string;
  observedValue: string;
  recommendedValue: string;
  selectorSample: string;
}

export interface A11yReport {
  issues: A11yTypographyIssue[];
  score: number; // 0..100
  scanned: number;
  errors: number;
  warnings: number;
  infos: number;
}

/* ────────────────────────────  Preferences  ──────────────────────────── */

export type ThemeName = 'light' | 'dark';

export interface Prefs {
  defaultUnit: SizeUnit;
  defaultExport: ExportFormat;
  theme: ThemeName;
  showSourceBadge: boolean;
  reducedMotion: 'auto' | 'on' | 'off';
}
