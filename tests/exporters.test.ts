import { describe, expect, it } from 'vitest';
import type { HierarchyReport } from '../src/shared/types';
import { exportTypography } from '../src/shared/exporters';

const FIXTURE: HierarchyReport = {
  entries: [
    {
      role: 'h1',
      selectorSample: 'h1.hero',
      sampleText: 'Headline',
      family: {
        raw: '"Inter", system-ui, sans-serif',
        primary: 'Inter',
        stack: ['Inter', 'system-ui'],
        generic: 'sans-serif',
      },
      fontSizePx: 48,
      fontSizeRange: [40, 56],
      lineHeightPx: 52.8,
      lineHeightRatio: 1.1,
      letterSpacingEm: -0.02,
      fontWeight: 700,
      textTransform: 'none',
      textAlign: 'start',
      occurrences: 1,
      color: '#0f172a',
      effectiveBg: '#ffffff',
    },
    {
      role: 'h2',
      selectorSample: 'h2',
      sampleText: 'Subheading',
      family: {
        raw: '"Inter", sans-serif',
        primary: 'Inter',
        stack: ['Inter'],
        generic: 'sans-serif',
      },
      fontSizePx: 32,
      fontSizeRange: [28, 36],
      lineHeightPx: 38.4,
      lineHeightRatio: 1.2,
      letterSpacingEm: 0,
      fontWeight: 600,
      textTransform: 'none',
      textAlign: 'start',
      occurrences: 4,
      color: null,
      effectiveBg: null,
    },
    {
      role: 'body',
      selectorSample: 'p',
      sampleText: 'Body copy lorem ipsum',
      family: {
        raw: '"Inter", sans-serif',
        primary: 'Inter',
        stack: ['Inter'],
        generic: 'sans-serif',
      },
      fontSizePx: 16,
      fontSizeRange: [16, 16],
      lineHeightPx: 25.6,
      lineHeightRatio: 1.6,
      letterSpacingEm: 0,
      fontWeight: 400,
      textTransform: 'none',
      textAlign: 'start',
      occurrences: 24,
      color: null,
      effectiveBg: null,
    },
    {
      role: 'caption',
      selectorSample: 'small',
      sampleText: 'Caption',
      family: {
        raw: '"Inter", sans-serif',
        primary: 'Inter',
        stack: ['Inter'],
        generic: 'sans-serif',
      },
      fontSizePx: 12,
      fontSizeRange: [12, 12],
      lineHeightPx: 16.8,
      lineHeightRatio: 1.4,
      letterSpacingEm: 0.01,
      fontWeight: 400,
      textTransform: 'none',
      textAlign: 'start',
      occurrences: 8,
      color: null,
      effectiveBg: null,
    },
  ],
  scale: {
    ratio: 1.25,
    ratioName: 'major-third',
    base: 16,
    confidence: 'high',
    observed: [16, 32, 48],
  },
  fontUsage: [{ family: 'Inter', count: 37, roles: ['h1', 'h2', 'body', 'caption'] }],
  fontSources: [],
  scanned: 200,
  elapsedMs: 12,
};

describe('exporters', () => {
  it('css-vars output contains expected tokens', () => {
    const out = exportTypography('css-vars', FIXTURE);
    expect(out).toContain(':root {');
    expect(out).toContain('--font-h1-size: 3rem;');
    expect(out).toContain('--font-h1-weight: 700;');
    expect(out).toContain('--font-body-size: 1rem;');
    expect(out).toContain('--font-family-sans: Inter, system-ui, sans-serif;');
  });

  it('tailwind output uses tuple form for fontSize', () => {
    const out = exportTypography('tailwind', FIXTURE);
    expect(out).toContain('module.exports');
    expect(out).toContain("h1: ['3rem', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.02em' }],");
    expect(out).toContain("body: ['1rem', { lineHeight: '1.6' }],");
  });

  it('scss output contains variables', () => {
    const out = exportTypography('scss', FIXTURE);
    expect(out).toContain('$font-h1-size: 3rem;');
    expect(out).toContain('$font-body-weight: 400;');
  });

  it('json output round-trips', () => {
    const out = exportTypography('json', FIXTURE);
    const parsed = JSON.parse(out);
    expect(parsed.typography.h1.fontSize).toBe('3rem');
    expect(parsed.typography.h1.fontWeight).toBe(700);
    expect(parsed.scale.name).toBe('major-third');
  });

  it('kadence output uses heading_N keys', () => {
    const out = exportTypography('kadence', FIXTURE);
    const parsed = JSON.parse(out);
    expect(parsed.kadence_typography_options.typography.heading_1.family).toBe('Inter');
    expect(parsed.kadence_typography_options.typography.text.size.desktop).toBe('1rem');
  });

  it('clamp output computes correct slope', () => {
    const out = exportTypography('clamp', FIXTURE);
    expect(out).toContain('clamp(');
    expect(out).toContain('--font-h1-size:');
    // The h1 entry has range [40, 56], so min/max-px are 40/56.
    // slope = (56 - 40) / (1440 - 320) = 0.01428...
    // yAxisRem = (40 - 0.01428 * 320) / 16 = (40 - 4.571) / 16 = 2.214
    expect(out).toMatch(/--font-h1-size: clamp\(2\.5rem, [0-9.]+rem \+ [0-9.]+vw, 3\.5rem\);/);
  });
});
