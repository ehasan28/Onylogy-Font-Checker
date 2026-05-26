import {
  IDEAL_BODY_LINE_HEIGHT,
  MAX_LINE_LENGTH,
  HARD_MAX_LINE_LENGTH,
  MIN_BODY_LINE_HEIGHT,
  MIN_BODY_PX,
  MIN_CAPTION_PX,
  MIN_LINE_LENGTH,
  MIN_UPPERCASE_LETTER_SPACING_EM,
  charsPerLine,
} from '../shared/typography/readability';
import { contrastRatio } from '../shared/typography/contrast';
import { parseColor } from '../shared/typography/convert';
import type {
  A11yReport,
  A11ySeverity,
  A11yTypographyIssue,
  HierarchyReport,
  TypographyEntry,
} from '../shared/types';

const SEVERITY_WEIGHT: Record<A11ySeverity, number> = {
  error: 15,
  warning: 5,
  info: 1,
};

/**
 * Run all checks against a HierarchyReport and produce an A11yReport with
 * a numeric score (100 = perfect, deductions per finding).
 */
export function analyzeAccessibility(report: HierarchyReport): A11yReport {
  const issues: A11yTypographyIssue[] = [];

  for (const entry of report.entries) {
    issues.push(...checkBodyTooSmall(entry));
    issues.push(...checkCaptionTooSmall(entry));
    issues.push(...checkLineHeight(entry));
    issues.push(...checkLineLength(entry));
    issues.push(...checkLetterSpacing(entry));
    issues.push(...checkThinWeight(entry));
    issues.push(...checkContrast(entry));
  }

  let score = 100;
  let errors = 0;
  let warnings = 0;
  let infos = 0;
  for (const i of issues) {
    score -= SEVERITY_WEIGHT[i.severity];
    if (i.severity === 'error') errors++;
    else if (i.severity === 'warning') warnings++;
    else infos++;
  }
  if (score < 0) score = 0;
  if (score > 100) score = 100;

  return {
    issues,
    score,
    scanned: report.entries.length,
    errors,
    warnings,
    infos,
  };
}

/* ───────────────────────────  Check helpers  ─────────────────────────── */

function checkBodyTooSmall(entry: TypographyEntry): A11yTypographyIssue[] {
  if (entry.role !== 'body') return [];
  if (entry.fontSizePx >= MIN_BODY_PX) return [];
  return [
    {
      id: 'body-too-small',
      severity: 'error',
      role: entry.role,
      message: 'Body text is below the 16px readability floor.',
      suggestion: 'Increase body font-size to at least 16px (1rem) for comfortable reading.',
      observedValue: `${round(entry.fontSizePx, 2)}px`,
      recommendedValue: `${MIN_BODY_PX}px`,
      selectorSample: entry.selectorSample,
    },
  ];
}

function checkCaptionTooSmall(entry: TypographyEntry): A11yTypographyIssue[] {
  if (entry.role !== 'caption') return [];
  if (entry.fontSizePx >= MIN_CAPTION_PX) return [];
  return [
    {
      id: 'caption-too-small',
      severity: 'warning',
      role: entry.role,
      message: 'Captions/small text below 12px become hard to read.',
      suggestion: 'Increase caption font-size to at least 12px.',
      observedValue: `${round(entry.fontSizePx, 2)}px`,
      recommendedValue: `${MIN_CAPTION_PX}px`,
      selectorSample: entry.selectorSample,
    },
  ];
}

function checkLineHeight(entry: TypographyEntry): A11yTypographyIssue[] {
  // Only check body-level roles where reading flow matters.
  if (entry.role !== 'body' && entry.role !== 'blockquote') return [];
  if (entry.lineHeightRatio == null) return [];
  if (entry.lineHeightRatio >= MIN_BODY_LINE_HEIGHT) return [];
  return [
    {
      id: 'line-height-too-tight',
      severity: 'warning',
      role: entry.role,
      message: 'Line height is too tight for comfortable reading.',
      suggestion: `Raise line-height to ${IDEAL_BODY_LINE_HEIGHT} or higher for body copy.`,
      observedValue: round(entry.lineHeightRatio, 2).toString(),
      recommendedValue: IDEAL_BODY_LINE_HEIGHT.toString(),
      selectorSample: entry.selectorSample,
    },
  ];
}

function checkLineLength(entry: TypographyEntry): A11yTypographyIssue[] {
  if (entry.role !== 'body' && entry.role !== 'blockquote') return [];
  // Estimate container width: use the document body width as a stand-in.
  const viewport = typeof window !== 'undefined' ? window.innerWidth : 0;
  if (!viewport) return [];
  const chars = charsPerLine(viewport, entry.fontSizePx, entry.family.raw);
  if (chars === 0) return [];
  const out: A11yTypographyIssue[] = [];

  if (chars > HARD_MAX_LINE_LENGTH) {
    out.push({
      id: 'line-length-too-long',
      severity: 'warning',
      role: entry.role,
      message: `Body lines reach ~${chars} chars — comfortable measure is 45-75.`,
      suggestion: 'Cap content width (e.g. max-width: 65ch) or increase font size.',
      observedValue: `${chars} chars/line`,
      recommendedValue: `${MIN_LINE_LENGTH}-${MAX_LINE_LENGTH} chars`,
      selectorSample: entry.selectorSample,
    });
  } else if (chars < MIN_LINE_LENGTH) {
    out.push({
      id: 'line-length-too-short',
      severity: 'info',
      role: entry.role,
      message: `Body lines are ~${chars} chars — comfortable measure is 45-75.`,
      suggestion: 'Allow content width to grow or reduce body font size.',
      observedValue: `${chars} chars/line`,
      recommendedValue: `${MIN_LINE_LENGTH}-${MAX_LINE_LENGTH} chars`,
      selectorSample: entry.selectorSample,
    });
  }
  return out;
}

function checkLetterSpacing(entry: TypographyEntry): A11yTypographyIssue[] {
  if (entry.textTransform !== 'uppercase') return [];
  if (entry.letterSpacingEm >= MIN_UPPERCASE_LETTER_SPACING_EM) return [];
  return [
    {
      id: 'letter-spacing-uppercase',
      severity: 'warning',
      role: entry.role,
      message: 'Uppercase text needs letter-spacing to stay legible.',
      suggestion: 'Add at least 0.05em of letter-spacing on uppercase text.',
      observedValue: `${round(entry.letterSpacingEm, 3)}em`,
      recommendedValue: `≥ ${MIN_UPPERCASE_LETTER_SPACING_EM}em`,
      selectorSample: entry.selectorSample,
    },
  ];
}

function checkThinWeight(entry: TypographyEntry): A11yTypographyIssue[] {
  if (entry.fontWeight > 300) return [];
  if (entry.fontSizePx >= 16) return [];
  return [
    {
      id: 'thin-weight-small-size',
      severity: 'warning',
      role: entry.role,
      message: 'Thin (≤300) weight at small sizes is hard to read.',
      suggestion: 'Increase font-weight to 400+ or bump font size.',
      observedValue: `${entry.fontWeight} · ${round(entry.fontSizePx, 1)}px`,
      recommendedValue: 'weight ≥ 400 or size ≥ 16px',
      selectorSample: entry.selectorSample,
    },
  ];
}

function checkContrast(entry: TypographyEntry): A11yTypographyIssue[] {
  if (!entry.color || !entry.effectiveBg) return [];
  const fg = parseColor(entry.color);
  const bg = parseColor(entry.effectiveBg);
  if (!fg || !bg) return [];
  const ratio = contrastRatio(fg, bg);
  // WCAG defines "large" as ≥ 18pt (24px) or ≥ 14pt bold (~18.66px @ 700).
  const isLarge =
    entry.fontSizePx >= 24 ||
    (entry.fontSizePx >= 18.66 && entry.fontWeight >= 700);
  const minRatio = isLarge ? 3 : 4.5;
  if (ratio >= minRatio) return [];
  return [
    {
      id: 'low-contrast',
      severity: 'error',
      role: entry.role,
      message: `Contrast ratio ${round(ratio, 2)}:1 is below WCAG AA ${
        isLarge ? '(large)' : '(normal)'
      }.`,
      suggestion: 'Darken text or lighten background to reach the minimum ratio.',
      observedValue: `${round(ratio, 2)}:1`,
      recommendedValue: `≥ ${minRatio}:1`,
      selectorSample: entry.selectorSample,
    },
  ];
}

function round(n: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}
