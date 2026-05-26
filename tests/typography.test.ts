import { describe, expect, it } from 'vitest';
import {
  parseFontFamily,
  parseLineHeight,
  parseLetterSpacing,
  splitTopLevelCommas,
  pxToRem,
  pxToEm,
  round,
} from '../src/shared/typography/parse';
import { detectScale } from '../src/shared/typography/scale';
import {
  avgGlyphWidthFactor,
  charsPerLine,
  checkMeasure,
} from '../src/shared/typography/readability';

describe('parseLineHeight', () => {
  it("returns null for 'normal'", () => {
    expect(parseLineHeight('normal', 16)).toEqual({ px: null, ratio: null });
  });

  it('parses unitless multiplier', () => {
    expect(parseLineHeight('1.5', 16)).toEqual({ px: 24, ratio: 1.5 });
  });

  it('parses px value', () => {
    expect(parseLineHeight('24px', 16)).toEqual({ px: 24, ratio: 1.5 });
  });

  it('parses percentage', () => {
    expect(parseLineHeight('150%', 16)).toEqual({ px: 24, ratio: 1.5 });
  });

  it('falls back gracefully for empty / undefined', () => {
    expect(parseLineHeight(undefined, 16)).toEqual({ px: null, ratio: null });
    expect(parseLineHeight('', 16)).toEqual({ px: null, ratio: null });
  });
});

describe('parseLetterSpacing', () => {
  it("returns 0 for 'normal'", () => {
    expect(parseLetterSpacing('normal', 16)).toEqual({ px: 0, em: 0 });
  });

  it('parses positive px', () => {
    expect(parseLetterSpacing('1.6px', 16)).toEqual({ px: 1.6, em: 0.1 });
  });

  it('parses negative px', () => {
    expect(parseLetterSpacing('-0.8px', 16)).toEqual({ px: -0.8, em: -0.05 });
  });
});

describe('parseFontFamily', () => {
  it('parses single quoted family with generic', () => {
    const out = parseFontFamily('"Inter", system-ui, sans-serif');
    expect(out.primary).toBe('Inter');
    expect(out.stack).toEqual(['Inter', 'system-ui']);
    expect(out.generic).toBe('sans-serif');
  });

  it('handles unquoted families', () => {
    const out = parseFontFamily('Georgia, Times New Roman, serif');
    expect(out.primary).toBe('Georgia');
    expect(out.stack).toEqual(['Georgia', 'Times New Roman']);
    expect(out.generic).toBe('serif');
  });

  it('handles generic-only', () => {
    const out = parseFontFamily('monospace');
    expect(out.primary).toBe('monospace');
    expect(out.generic).toBe('monospace');
    expect(out.stack).toEqual([]);
  });

  it('handles mixed quoted/unquoted with embedded comma', () => {
    // The "B, C" should stay in one segment because it's inside quotes.
    const out = parseFontFamily('"Inter, Display", Helvetica, sans-serif');
    expect(out.stack).toEqual(['Inter, Display', 'Helvetica']);
    expect(out.generic).toBe('sans-serif');
  });

  it('handles empty input', () => {
    const out = parseFontFamily('');
    expect(out.primary).toBe('');
    expect(out.stack).toEqual([]);
    expect(out.generic).toBeNull();
  });
});

describe('splitTopLevelCommas', () => {
  it('respects quotes', () => {
    expect(splitTopLevelCommas('a "b, c" d, e')).toEqual(['a "b, c" d', ' e']);
  });
});

describe('pxToRem / pxToEm / round', () => {
  it('pxToRem default base 16', () => {
    expect(pxToRem(24)).toBe('1.5rem');
    expect(pxToRem(16)).toBe('1rem');
  });

  it('pxToEm relative to parent', () => {
    expect(pxToEm(24, 16)).toBe('1.5em');
  });

  it('round preserves correctness', () => {
    expect(round(1.23456, 2)).toBe(1.23);
    expect(round(1.235, 2)).toBe(1.24);
    expect(round(0.6789, 3)).toBe(0.679);
  });
});

describe('detectScale', () => {
  it('detects major-third (1.25)', () => {
    // 16, 20, 25, 31.25, 39.0625 — clean 1.25 progression
    const out = detectScale([16, 20, 25, 31.25, 39.0625]);
    expect(out.ratio).toBeCloseTo(1.25, 2);
    expect(out.ratioName).toBe('major-third');
    expect(out.confidence).toBe('high');
  });

  it('low confidence for truly irregular sizes', () => {
    // Wildly different ratios — no scale at all.
    const out = detectScale([12, 18, 22, 35, 41]);
    // No two consecutive ratios are within 0.03 of one another.
    expect(out.confidence).toBe('low');
  });

  it('detects a major-second-like progression (1.125)', () => {
    // 14, 16, 18, 21, 24 follow a near-1.14 progression that maps to
    // major-second (1.125) within the 0.04 tolerance.
    const out = detectScale([14, 16, 18, 21, 24]);
    expect(out.ratioName).toBe('major-second');
    expect(['medium', 'high']).toContain(out.confidence);
  });

  it('returns null ratio for a single size', () => {
    const out = detectScale([16]);
    expect(out.ratio).toBeNull();
    expect(out.confidence).toBe('low');
  });

  it('detects perfect-fourth (1.333)', () => {
    // 16, 21.33, 28.43, 37.9
    const out = detectScale([16, 21.33, 28.43, 37.9]);
    expect(out.ratioName).toBe('perfect-fourth');
  });

  it('drops sizes below 12px (icons / utility)', () => {
    const out = detectScale([8, 10, 16, 20, 25, 31.25]);
    expect(out.observed).toEqual([16, 20, 25, 31.25]);
  });
});

describe('readability', () => {
  it('avgGlyphWidthFactor by family family', () => {
    expect(avgGlyphWidthFactor('Inter')).toBe(0.5);
    expect(avgGlyphWidthFactor('Georgia, serif')).toBe(0.48);
    expect(avgGlyphWidthFactor('JetBrains Mono')).toBe(0.6);
  });

  it('charsPerLine matches expected approximation', () => {
    // 600px wide, 16px font, sans (0.5 factor) → 600 / 8 = 75
    expect(charsPerLine(600, 16, 'Inter')).toBe(75);
  });

  it('checkMeasure classifies correctly', () => {
    expect(checkMeasure(30).status).toBe('short');
    expect(checkMeasure(60).status).toBe('ideal');
    expect(checkMeasure(80).status).toBe('long');
    expect(checkMeasure(120).status).toBe('too-long');
  });
});
