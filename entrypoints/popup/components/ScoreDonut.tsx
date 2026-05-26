import { motion, useReducedMotion } from 'framer-motion';
import { AnimatedNumber } from './motion/AnimatedNumber';

const SIZE = 96;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

export function ScoreDonut({ score }: { score: number }) {
  const reduce = useReducedMotion();
  const offset = CIRC * (1 - score / 100);
  const tone = score >= 90 ? 'var(--ok)' : score >= 70 ? 'var(--accent)' : 'var(--bad)';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="var(--line)"
          strokeWidth={STROKE}
          fill="none"
        />
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={tone}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={CIRC}
          initial={reduce ? { strokeDashoffset: offset } : { strokeDashoffset: CIRC }}
          animate={{ strokeDashoffset: offset }}
          transition={{
            duration: reduce ? 0 : 0.9,
            ease: [0.2, 0.65, 0.3, 1],
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedNumber
          value={score}
          decimals={0}
          className="font-display text-3xl leading-none text-fg"
        />
        <span className="mt-0.5 text-[9px] uppercase tracking-wider text-fg-dim">
          score
        </span>
      </div>
    </div>
  );
}
