import type { ScaleAnalysis } from '../types';

/**
 * Known modular scale ratios used in typography systems.
 * Source: tools like type-scale.com, modularscale.com, and common design systems.
 */
export const KNOWN_RATIOS: Array<{ value: number; name: string }> = [
  { value: 1.067, name: 'minor-second' },
  { value: 1.125, name: 'major-second' },
  { value: 1.2, name: 'minor-third' },
  { value: 1.25, name: 'major-third' },
  { value: 1.333, name: 'perfect-fourth' },
  { value: 1.414, name: 'augmented-fourth' },
  { value: 1.5, name: 'perfect-fifth' },
  { value: 1.618, name: 'golden-ratio' },
];

const TOLERANCE = 0.04;

/**
 * Detect the modular scale of a page from observed font sizes.
 *
 * Strategy:
 *   1. Sort + dedupe input sizes; drop anything < 12 (likely icons/utility).
 *   2. Compute consecutive ratios (pair[i+1] / pair[i]).
 *   3. Take the median ratio, match to KNOWN_RATIOS within ±TOLERANCE.
 *   4. Confidence: high if 3+ adjacent pairs agree within ±0.03 of median,
 *      medium if exactly 2, low otherwise.
 */
export function detectScale(sizesPx: number[], base = 16): ScaleAnalysis {
  const observed = Array.from(new Set(sizesPx.map((n) => round2(n))))
    .filter((n) => n >= 12)
    .sort((a, b) => a - b);

  if (observed.length < 2) {
    return {
      ratio: null,
      ratioName: null,
      base,
      confidence: 'low',
      observed,
    };
  }

  const ratios: number[] = [];
  for (let i = 1; i < observed.length; i++) {
    ratios.push(observed[i] / observed[i - 1]);
  }

  const median = medianOf(ratios);
  const named = closestNamed(median);
  const adjacentMatches = ratios.filter((r) => Math.abs(r - median) <= 0.03).length;

  let confidence: ScaleAnalysis['confidence'] = 'low';
  if (adjacentMatches >= 3) confidence = 'high';
  else if (adjacentMatches >= 2) confidence = 'medium';

  // If the median doesn't match any known ratio within tolerance, downgrade.
  if (!named) confidence = 'low';

  return {
    ratio: round2(median, 3),
    ratioName: named?.name ?? null,
    base,
    confidence,
    observed,
  };
}

function closestNamed(ratio: number): { value: number; name: string } | null {
  let best: { value: number; name: string } | null = null;
  let bestDelta = Infinity;
  for (const r of KNOWN_RATIOS) {
    const d = Math.abs(r.value - ratio);
    if (d < bestDelta) {
      bestDelta = d;
      best = r;
    }
  }
  if (best && bestDelta <= TOLERANCE) return best;
  return null;
}

function medianOf(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = nums.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function round2(n: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}
