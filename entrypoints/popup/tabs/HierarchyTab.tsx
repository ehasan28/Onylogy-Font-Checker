import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, RefreshCw } from 'lucide-react';
import { SlideUp } from '../components/motion/SlideUp';
import { StaggerList } from '../components/motion/StaggerList';
import { Button } from '../components/ui/Button';
import { Separator } from '../components/ui/Separator';
import { HierarchyRow } from '../components/HierarchyRow';
import { ScaleVisualizer } from '../components/ScaleVisualizer';
import { FontSourceBadge } from '../components/FontSourceBadge';
import { sendToActiveTab } from '../../../src/shared/messaging';
import { getLastHierarchy, setLastHierarchy } from '../../../src/shared/storage';
import type { HierarchyReport, SizeUnit } from '../../../src/shared/types';

export interface HierarchyTabProps {
  unit: SizeUnit;
}

export function HierarchyTab({ unit = 'rem' }: { unit?: SizeUnit } = {}) {
  const [report, setReport] = useState<HierarchyReport | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLastHierarchy().then((r) => r && setReport(r));
  }, []);

  const extract = useCallback(async () => {
    setExtracting(true);
    setError(null);
    const reply = await sendToActiveTab({ type: 'EXTRACT_HIERARCHY' });
    setExtracting(false);
    if ('payload' in reply && reply.type === 'EXTRACT_HIERARCHY_RESULT') {
      if (reply.payload.ok) {
        setReport(reply.payload.result);
        setLastHierarchy(reply.payload.result);
      } else {
        setError(reply.payload.message ?? 'Extraction failed');
      }
    } else if (reply.type === 'PAGE_UNSUPPORTED') {
      setError('This page does not support content scripts.');
    } else if (reply.type === 'NO_TAB') {
      setError('No active tab.');
    }
  }, []);

  return (
    <SlideUp className="space-y-4 p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-fg-dim">
            Hierarchy
          </p>
          <h2 className="mt-1 font-display text-2xl leading-tight text-fg">
            Type scale of the page
          </h2>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={extract}
          disabled={extracting}
        >
          <motion.span
            animate={extracting ? { rotate: 360 } : { rotate: 0 }}
            transition={
              extracting
                ? { duration: 1.2, repeat: Infinity, ease: 'linear' }
                : { duration: 0.3 }
            }
          >
            <RefreshCw size={13} strokeWidth={2.2} />
          </motion.span>
          <span>{extracting ? 'Scanning…' : report ? 'Re-scan' : 'Extract'}</span>
        </Button>
      </header>

      <AnimatePresence mode="wait">
        {!report && !extracting && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded-xl border border-line border-dashed bg-bg-elev/40 p-6 text-center"
          >
            <Layers size={20} strokeWidth={1.6} className="mx-auto text-fg-dim" />
            <p className="mt-2 font-display text-base text-fg">
              Run a scan to see the page's hierarchy
            </p>
            <p className="mt-1 text-[11px] text-fg-muted">
              Headings, body, captions, buttons, and links — grouped, scaled, and
              ready to export.
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
            className="space-y-5"
          >
            <ScaleVisualizer scale={report.scale} />

            {/* Font sources */}
            {report.fontSources.length > 0 && (
              <section className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-fg-dim">
                  Fonts in use
                </p>
                <StaggerList className="space-y-1.5" stagger={0.05}>
                  {report.fontSources.map((src) => (
                    <div
                      key={src.family}
                      className="flex items-center justify-between rounded-lg border border-line bg-bg-elev px-3 py-2"
                    >
                      <span className="font-mono text-xs text-fg tabular">
                        {src.family}
                      </span>
                      <FontSourceBadge
                        source={src.source}
                        loaded={src.loaded}
                        variable={src.variable}
                      />
                    </div>
                  ))}
                </StaggerList>
              </section>
            )}

            <Separator />

            {/* Hierarchy entries */}
            <section className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-fg-dim">
                {report.entries.length} roles · {report.scanned} elements ·{' '}
                {report.elapsedMs}ms
              </p>
              <StaggerList className="space-y-2.5" stagger={0.04}>
                {report.entries.map((e) => (
                  <HierarchyRow key={e.role} entry={e} unit={unit} />
                ))}
              </StaggerList>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </SlideUp>
  );
}
