import { motion, useReducedMotion } from 'framer-motion';
import { Badge } from './ui/Badge';
import type { ScaleAnalysis } from '../../../src/shared/types';
import { round } from '../../../src/shared/typography/parse';

const CONFIDENCE_TONE = {
  high: 'ok',
  medium: 'warn',
  low: 'neutral',
} as const;

const CONFIDENCE_LABEL = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
} as const;

export function ScaleVisualizer({ scale }: { scale: ScaleAnalysis }) {
  const reduce = useReducedMotion();
  const sizes = scale.observed.length
    ? scale.observed
    : [12, 14, 16, 18, 24, 32]; // placeholder when empty
  const max = Math.max(...sizes);
  const min = Math.min(...sizes);

  return (
    <motion.section
      layout
      className="rounded-2xl border border-line bg-bg-elev p-5"
      transition={{ layout: { type: 'spring', stiffness: 280, damping: 30 } }}
    >
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-fg-dim">
            Modular scale
          </p>
          <h3 className="mt-1 font-display text-xl leading-tight text-fg">
            {scale.ratioName ? prettyName(scale.ratioName) : 'No scale detected'}
          </h3>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="font-mono tabular text-2xl text-accent">
            {scale.ratio ? round(scale.ratio, 3) : '—'}
          </span>
          <Badge
            variant={
              CONFIDENCE_TONE[scale.confidence] as 'ok' | 'warn' | 'neutral'
            }
          >
            {CONFIDENCE_LABEL[scale.confidence]}
          </Badge>
        </div>
      </header>

      {/* Bars — one per observed size, animated from 0 to its width */}
      <div className="space-y-1.5">
        {sizes.map((s, i) => {
          const pct = Math.round(((s - min) / Math.max(max - min, 1)) * 100);
          return (
            <div key={s + '-' + i} className="flex items-center gap-3">
              <span className="w-12 shrink-0 font-mono tabular text-[10px] text-fg-dim">
                {round(s, 1)}px
              </span>
              <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-line">
                <motion.span
                  className="absolute inset-y-0 left-0 rounded-full bg-accent"
                  initial={reduce ? { width: `${pct}%` } : { width: '0%' }}
                  animate={{ width: `${pct}%` }}
                  transition={{
                    type: 'spring',
                    stiffness: 220,
                    damping: 28,
                    delay: 0.05 * i,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}

function prettyName(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
