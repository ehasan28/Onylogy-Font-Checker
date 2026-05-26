import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, RefreshCw } from 'lucide-react';
import { SlideUp } from '../components/motion/SlideUp';
import { Button } from '../components/ui/Button';
import { Slider } from '../components/ui/Slider';
import { Separator } from '../components/ui/Separator';
import { CopyButton } from '../components/CopyButton';
import { ToggleGroup, ToggleGroupItem } from '../components/ui/ToggleGroup';
import { sendToActiveTab } from '../../../src/shared/messaging';
import { getLastHierarchy, setLastHierarchy } from '../../../src/shared/storage';
import {
  EXPORT_FORMATS,
  exportTypography,
} from '../../../src/shared/exporters';
import type { ExportFormat, HierarchyReport } from '../../../src/shared/types';

export function ExportTab() {
  const [report, setReport] = useState<HierarchyReport | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('css-vars');
  const [error, setError] = useState<string | null>(null);
  // Slider value drives the clamp preview viewport size.
  const [previewVp, setPreviewVp] = useState(768);

  useEffect(() => {
    getLastHierarchy().then((r) => r && setReport(r));
  }, []);

  const extract = async () => {
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
    }
  };

  const output = useMemo(
    () => (report ? exportTypography(format, report) : ''),
    [report, format],
  );

  return (
    <SlideUp className="space-y-4 p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-fg-dim">
            Export
          </p>
          <h2 className="mt-1 font-display text-2xl leading-tight text-fg">
            Take this system anywhere
          </h2>
        </div>
        {!report ? (
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
            <span>{extracting ? 'Scanning…' : 'Extract first'}</span>
          </Button>
        ) : (
          <CopyButton value={output} label="Copy all" variant="primary" size="sm" />
        )}
      </header>

      {/* Format toggle — chip slides between options via shared layoutId */}
      <ToggleGroup
        type="single"
        value={format}
        onValueChange={(v) => v && setFormat(v as ExportFormat)}
        layoutGroupId="export-format-chip"
        className="w-full justify-between"
      >
        {EXPORT_FORMATS.map((f) => (
          <ToggleGroupItem
            key={f.value}
            value={f.value}
            aria-label={f.label}
            className="flex-1 px-2 text-[11px]"
          >
            {f.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {/* Clamp viewport preview — only shown for the clamp format */}
      <AnimatePresence>
        {format === 'clamp' && report && (
          <motion.section
            key="clamp-preview"
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="overflow-hidden rounded-xl border border-line bg-bg-elev"
          >
            <div className="border-b border-line px-4 py-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-wider text-fg-dim">
                  Preview at viewport
                </p>
                <span className="font-mono tabular text-xs text-accent">
                  {previewVp}px
                </span>
              </div>
              <Slider
                className="mt-2"
                value={[previewVp]}
                onValueChange={(v) => setPreviewVp(v[0] ?? 768)}
                min={320}
                max={1440}
                step={10}
              />
            </div>
            <ClampPreview report={report} viewport={previewVp} />
          </motion.section>
        )}
      </AnimatePresence>

      <Separator />

      {error && (
        <div className="rounded-xl border border-bad/30 bg-bad/10 p-4 text-xs text-bad">
          {error}
        </div>
      )}

      {!report && !error && (
        <div className="rounded-xl border border-line border-dashed bg-bg-elev/40 p-6 text-center">
          <Download size={20} strokeWidth={1.6} className="mx-auto text-fg-dim" />
          <p className="mt-2 font-display text-base text-fg">
            Extract a hierarchy first
          </p>
          <p className="mt-1 text-[11px] text-fg-muted">
            Once the page is analyzed, every format renders below.
          </p>
        </div>
      )}

      {/* Output codeblock — animated when format changes */}
      <AnimatePresence mode="wait">
        {report && (
          <motion.pre
            key={format}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="overflow-x-auto rounded-xl border border-line bg-bg-elev-2 p-4 font-mono text-[11px] leading-relaxed text-fg tabular"
          >
            <code>{output}</code>
          </motion.pre>
        )}
      </AnimatePresence>
    </SlideUp>
  );
}

/* ─────────────────────────  Clamp preview pane  ──────────────────────── */

function ClampPreview({
  report,
  viewport,
}: {
  report: HierarchyReport;
  viewport: number;
}) {
  // Compute the actual rendered size for each role at the given viewport
  // by re-running the same formula clamp.ts encodes.
  const VPMIN = 320;
  const VPMAX = 1440;
  const BASE = 16;

  return (
    <ul className="space-y-1.5 px-4 py-3">
      {report.entries.slice(0, 6).map((e) => {
        const [obsMin, obsMax] = e.fontSizeRange;
        const tight = obsMax - obsMin < 1;
        const minPx = tight ? Math.round(e.fontSizePx * 0.75) : obsMin;
        const maxPx = tight ? Math.round(e.fontSizePx) : obsMax;
        const slope = (maxPx - minPx) / (VPMAX - VPMIN);
        const yAxisPx = minPx - slope * VPMIN;
        const previewPx = clamp(yAxisPx + slope * viewport, minPx, maxPx);

        const displaySize = Math.min(Math.max(previewPx, 11), 28);
        void BASE;

        return (
          <li
            key={e.role}
            className="flex items-baseline justify-between gap-3 truncate"
          >
            <span
              className="truncate text-fg"
              style={{
                fontFamily: e.family.raw || 'inherit',
                fontSize: `${displaySize}px`,
                fontWeight: e.fontWeight,
              }}
            >
              {e.role.toUpperCase()} · {e.sampleText.slice(0, 30) || 'Aa'}
            </span>
            <span className="font-mono tabular text-[10px] text-fg-dim">
              {previewPx.toFixed(1)}px
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function clamp(n: number, min: number, max: number): number {
  if (n < min) return min;
  if (n > max) return max;
  return n;
}
