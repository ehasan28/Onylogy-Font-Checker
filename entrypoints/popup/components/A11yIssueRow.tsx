import { motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Badge } from './ui/Badge';
import type { A11ySeverity, A11yTypographyIssue } from '../../../src/shared/types';

const SEVERITY_META: Record<
  A11ySeverity,
  { Icon: typeof AlertCircle; tone: 'bad' | 'warn' | 'neutral' }
> = {
  error: { Icon: AlertCircle, tone: 'bad' },
  warning: { Icon: AlertTriangle, tone: 'warn' },
  info: { Icon: Info, tone: 'neutral' },
};

export function A11yIssueRow({ issue }: { issue: A11yTypographyIssue }) {
  const { Icon, tone } = SEVERITY_META[issue.severity];
  return (
    <motion.article
      className="rounded-xl border border-line bg-bg-elev p-4"
      whileHover={{ y: -1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={
              'flex h-5 w-5 items-center justify-center rounded-full ' +
              (tone === 'bad'
                ? 'bg-bad/15 text-bad'
                : tone === 'warn'
                  ? 'bg-warn/15 text-warn'
                  : 'bg-line text-fg-muted')
            }
          >
            <Icon size={11} strokeWidth={2.4} />
          </span>
          <Badge variant={tone}>{issue.severity}</Badge>
          <Badge variant="neutral" className="font-mono">
            {issue.role.toUpperCase()}
          </Badge>
        </div>
        <span className="font-mono text-[10px] tabular text-fg-dim">
          {issue.selectorSample}
        </span>
      </header>

      <p className="mt-2 text-sm leading-snug text-fg">{issue.message}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-fg-muted">
        {issue.suggestion}
      </p>

      <dl className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-line-soft bg-bg-elev-2 p-2 text-[11px]">
        <div>
          <dt className="text-[9px] uppercase tracking-wider text-fg-dim">
            Observed
          </dt>
          <dd className="font-mono tabular text-fg">{issue.observedValue}</dd>
        </div>
        <div>
          <dt className="text-[9px] uppercase tracking-wider text-fg-dim">
            Recommended
          </dt>
          <dd className="font-mono tabular text-accent">{issue.recommendedValue}</dd>
        </div>
      </dl>
    </motion.article>
  );
}
