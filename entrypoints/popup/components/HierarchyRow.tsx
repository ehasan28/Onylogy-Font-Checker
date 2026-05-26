import { motion } from 'framer-motion';
import { Badge } from './ui/Badge';
import { CopyButton } from './CopyButton';
import type { TypographyEntry, SizeUnit } from '../../../src/shared/types';
import { pxToRem, round } from '../../../src/shared/typography/parse';

export function HierarchyRow({
  entry,
  unit,
}: {
  entry: TypographyEntry;
  unit: SizeUnit;
}) {
  const sizeLabel = formatSize(entry.fontSizePx, unit);
  const family = entry.family.primary || entry.family.generic || 'inherit';
  const previewSize = Math.min(Math.max(entry.fontSizePx, 14), 56);

  return (
    <motion.div
      className="group rounded-xl border border-line bg-bg-elev p-4 transition-colors hover:border-fg-dim/40"
      whileHover={{ y: -1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
    >
      <div className="mb-2 flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="accent" className="font-mono">
            {entry.role.toUpperCase()}
          </Badge>
          <span className="font-mono text-[10px] tabular text-fg-dim">
            ×{entry.occurrences}
          </span>
        </div>
        <span className="font-mono text-[11px] tabular text-fg-muted">{sizeLabel}</span>
      </div>

      <p
        className="truncate text-fg"
        style={{
          fontFamily: entry.family.raw || 'inherit',
          fontSize: `${previewSize}px`,
          fontWeight: entry.fontWeight,
          lineHeight: entry.lineHeightRatio ?? 1.2,
          letterSpacing: `${entry.letterSpacingEm}em`,
          textTransform: entry.textTransform as React.CSSProperties['textTransform'],
        }}
        title={entry.sampleText}
      >
        {entry.sampleText || 'The quick brown fox jumps'}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-fg-muted">
        <Meta label="Family" value={family} mono />
        <Meta label="Weight" value={String(entry.fontWeight)} />
        {entry.lineHeightRatio != null && (
          <Meta
            label="LH"
            value={`${round(entry.lineHeightRatio, 2)}${
              entry.lineHeightPx ? ` · ${round(entry.lineHeightPx, 1)}px` : ''
            }`}
          />
        )}
        {entry.letterSpacingEm !== 0 && (
          <Meta label="LS" value={`${round(entry.letterSpacingEm, 3)}em`} />
        )}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="font-mono text-[10px] tabular text-fg-dim">
          {entry.selectorSample}
        </span>
        <CopyButton
          value={JSON.stringify(
            {
              role: entry.role,
              family,
              fontSize: sizeLabel,
              fontWeight: entry.fontWeight,
              lineHeight: entry.lineHeightRatio,
              letterSpacing: `${entry.letterSpacingEm}em`,
            },
            null,
            2,
          )}
          label="Copy"
          variant="ghost"
          size="sm"
        />
      </div>
    </motion.div>
  );
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="text-[9px] uppercase tracking-wider text-fg-dim">{label}</span>
      <span className={mono ? 'font-mono tabular' : ''}>{value}</span>
    </span>
  );
}

function formatSize(px: number, unit: SizeUnit): string {
  if (unit === 'rem') return pxToRem(px);
  if (unit === 'em') return `${round(px / 16, 3)}em`;
  return `${round(px, 2)}px`;
}
