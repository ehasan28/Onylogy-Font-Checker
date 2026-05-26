import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { SlideUp } from '../components/motion/SlideUp';
import { StaggerList } from '../components/motion/StaggerList';
import { Button } from '../components/ui/Button';
import { Separator } from '../components/ui/Separator';
import { ScoreDonut } from '../components/ScoreDonut';
import { A11yIssueRow } from '../components/A11yIssueRow';
import { sendToActiveTab } from '../../../src/shared/messaging';
import { getLastA11y, setLastA11y } from '../../../src/shared/storage';
import type { A11yReport, A11ySeverity } from '../../../src/shared/types';

const FILTERS: { key: 'all' | A11ySeverity; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'error', label: 'Errors' },
  { key: 'warning', label: 'Warnings' },
  { key: 'info', label: 'Info' },
];

export function AccessibilityTab() {
  const [report, setReport] = useState<A11yReport | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | A11ySeverity>('all');

  useEffect(() => {
    getLastA11y().then((r) => r && setReport(r));
  }, []);

  const run = useCallback(async () => {
    setRunning(true);
    setError(null);
    const reply = await sendToActiveTab({ type: 'ANALYZE_ACCESSIBILITY' });
    setRunning(false);
    if ('payload' in reply && reply.type === 'ANALYZE_ACCESSIBILITY_RESULT') {
      if (reply.payload.ok) {
        setReport(reply.payload.result);
        setLastA11y(reply.payload.result);
      } else {
        setError(reply.payload.message ?? 'Analysis failed');
      }
    } else if (reply.type === 'PAGE_UNSUPPORTED') {
      setError('This page does not support content scripts.');
    } else if (reply.type === 'NO_TAB') {
      setError('No active tab.');
    }
  }, []);

  const visibleIssues = report
    ? filter === 'all'
      ? report.issues
      : report.issues.filter((i) => i.severity === filter)
    : [];

  return (
    <SlideUp className="space-y-4 p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-fg-dim">
            Accessibility
          </p>
          <h2 className="mt-1 font-display text-2xl leading-tight text-fg">
            Readability & contrast
          </h2>
        </div>
        <Button variant="primary" size="sm" onClick={run} disabled={running}>
          <motion.span
            animate={running ? { rotate: 360 } : { rotate: 0 }}
            transition={
              running
                ? { duration: 1.2, repeat: Infinity, ease: 'linear' }
                : { duration: 0.3 }
            }
          >
            <RefreshCw size={13} strokeWidth={2.2} />
          </motion.span>
          <span>{running ? 'Analyzing…' : report ? 'Re-analyze' : 'Analyze'}</span>
        </Button>
      </header>

      <AnimatePresence mode="wait">
        {!report && !running && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded-xl border border-line border-dashed bg-bg-elev/40 p-6 text-center"
          >
            <p className="font-display text-base text-fg">
              Check this page for readability gaps
            </p>
            <p className="mt-1 text-[11px] text-fg-muted">
              Run an analysis to score body sizing, line height, measure,
              contrast, and more.
            </p>
          </motion.div>
        )}

        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded-xl border border-bad/30 bg-bad/10 p-4 text-xs text-bad"
          >
            {error}
          </motion.div>
        )}

        {report && (
          <motion.div
            key="report"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Score row */}
            <section className="flex items-center gap-5 rounded-2xl border border-line bg-bg-elev p-5">
              <ScoreDonut score={report.score} />
              <div className="flex-1">
                <Stat label="Errors" value={report.errors} tone="bad" />
                <Stat label="Warnings" value={report.warnings} tone="warn" />
                <Stat label="Info" value={report.infos} tone="neutral" />
                <p className="mt-2 text-[10px] text-fg-dim">
                  Across {report.scanned} typographic roles
                </p>
              </div>
            </section>

            {/* Filter bar */}
            {report.issues.length > 0 && (
              <div className="flex items-center gap-1 rounded-full border border-line bg-bg-elev p-0.5">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className={
                      'relative h-7 flex-1 rounded-full text-xs font-medium transition-colors ' +
                      (filter === f.key
                        ? 'text-accent-contrast'
                        : 'text-fg-muted hover:text-fg')
                    }
                  >
                    {filter === f.key && (
                      <motion.span
                        layoutId="a11y-filter-chip"
                        className="absolute inset-0 rounded-full bg-accent"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">
                      {f.label}{' '}
                      {f.key !== 'all' && (
                        <span className="opacity-60">
                          ·{' '}
                          {f.key === 'error'
                            ? report.errors
                            : f.key === 'warning'
                              ? report.warnings
                              : report.infos}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <Separator />

            {/* Issues — or success state */}
            {visibleIssues.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-2 rounded-xl border border-ok/30 bg-ok/5 p-6 text-center"
              >
                <CheckCircle2 size={22} strokeWidth={1.8} className="text-ok" />
                <p className="font-display text-base text-fg">No issues</p>
                <p className="text-[11px] text-fg-muted">
                  Nothing flagged at this severity. Good typography.
                </p>
              </motion.div>
            ) : (
              <StaggerList className="space-y-2.5" stagger={0.04}>
                {visibleIssues.map((issue, i) => (
                  <A11yIssueRow key={i} issue={issue} />
                ))}
              </StaggerList>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </SlideUp>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'bad' | 'warn' | 'neutral';
}) {
  const color = tone === 'bad' ? 'text-bad' : tone === 'warn' ? 'text-warn' : 'text-fg-muted';
  return (
    <div className="flex items-center justify-between border-b border-line-soft py-1.5 last:border-b-0">
      <span className="text-[10px] uppercase tracking-wider text-fg-dim">
        {label}
      </span>
      <span className={'font-mono text-base tabular ' + color}>{value}</span>
    </div>
  );
}
