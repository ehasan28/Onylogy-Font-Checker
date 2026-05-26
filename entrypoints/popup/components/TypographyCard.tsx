import { motion } from 'framer-motion';
import { AnimatedNumber } from './motion/AnimatedNumber';
import { CopyButton } from './CopyButton';
import { Badge } from './ui/Badge';
import { cn } from './ui/cn';
import type { ElementTypography, SizeUnit } from '../../../src/shared/types';
import { pxToRem, round } from '../../../src/shared/typography/parse';

export interface TypographyCardProps {
  data: ElementTypography | null;
  unit: SizeUnit;
}

/**
 * Card showing the live inspected typography. The display preview renders
 * the captured sample text in the actual inspected family + size + weight
 * so the user sees the real result rather than a generic mock.
 */
export function TypographyCard({ data, unit }: TypographyCardProps) {
  if (!data) {
    return (
      <div className="rounded-2xl border border-line border-dashed bg-bg-elev/40 p-6 text-center">
        <p className="font-display text-base text-fg-muted">
          Move your cursor over any text<span className="animate-caret">_</span>
        </p>
        <p className="mt-1 text-[11px] text-fg-dim">
          The live tooltip on the page mirrors this readout.
        </p>
      </div>
    );
  }

  const sizeLabel = renderSize(data.fontSizePx, unit, data);
  const family = data.family.primary || data.family.generic || '—';

  return (
    <motion.div
      layout
      className="overflow-hidden rounded-2xl border border-line bg-bg-elev"
      transition={{ layout: { type: 'spring', stiffness: 280, damping: 30 } }}
    >
      {/* Display preview — uses the actual inspected typography */}
      <div className="border-b border-line px-5 pb-4 pt-5">
        <p className="text-[10px] uppercase tracking-wider text-fg-dim">
          {data.tag} · {data.selector}
        </p>
        <p
          className="mt-2 truncate text-2xl"
          style={{
            fontFamily: data.family.raw || 'inherit',
            fontWeight: data.fontWeight,
            fontStyle: data.fontStyle,
            letterSpacing: `${data.letterSpacingEm}em`,
          }}
          title={data.sampleText}
        >
          {data.sampleText || 'The quick brown fox jumps'}
        </p>
      </div>

      <div className="grid grid-cols-[max-content_1fr_auto] gap-x-4 gap-y-2 px-5 py-4 text-xs">
        <Row label="Family">
          <span className="font-mono tabular">{family}</span>
          {data.family.generic && (
            <Badge variant="neutral" className="ml-2 uppercase">
              {data.family.generic}
            </Badge>
          )}
        </Row>

        <Row label="Size" copy={sizeLabel}>
          <AnimatedSizeReadout px={data.fontSizePx} unit={unit} />
        </Row>

        <Row
          label="Weight"
          copy={String(data.fontWeight)}
        >
          <AnimatedNumber
            className="font-mono tabular"
            value={data.fontWeight}
          />
        </Row>

        <Row
          label="Line"
          copy={
            data.lineHeightPx == null
              ? 'normal'
              : `${round(data.lineHeightPx, 2)}px`
          }
        >
          {data.lineHeightPx == null ? (
            <span className="font-mono tabular text-fg-muted">normal</span>
          ) : (
            <span className="font-mono tabular">
              <AnimatedNumber value={data.lineHeightPx} decimals={1} suffix="px" />
              <span className="text-fg-dim"> · </span>
              <AnimatedNumber value={data.lineHeightRatio ?? 0} decimals={2} />
            </span>
          )}
        </Row>

        <Row
          label="Tracking"
          copy={`${round(data.letterSpacingEm, 3)}em`}
        >
          <span
            className={cn(
              'font-mono tabular',
              data.letterSpacingEm === 0 && 'text-fg-muted',
            )}
          >
            <AnimatedNumber
              value={data.letterSpacingEm}
              decimals={3}
              suffix="em"
            />
          </span>
        </Row>

        {data.textTransform !== 'none' && (
          <Row label="Transform" copy={data.textTransform}>
            <span className="font-mono tabular">{data.textTransform}</span>
          </Row>
        )}
        {data.textAlign && data.textAlign !== 'start' && (
          <Row label="Align" copy={data.textAlign}>
            <span className="font-mono tabular">{data.textAlign}</span>
          </Row>
        )}
        {data.color && (
          <Row label="Color" copy={data.color}>
            <span className="inline-flex items-center gap-2 font-mono tabular">
              <span
                aria-hidden
                className="inline-block h-3 w-3 rounded border border-line"
                style={{ background: data.color }}
              />
              {data.color}
            </span>
          </Row>
        )}
      </div>
    </motion.div>
  );
}

function Row({
  label,
  copy,
  children,
}: {
  label: string;
  copy?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <span className="text-[10px] uppercase tracking-wider text-fg-dim pt-0.5">
        {label}
      </span>
      <span className="text-fg overflow-hidden">{children}</span>
      <span className="flex justify-end">
        {copy && (
          <CopyButton
            variant="ghost"
            size="icon-sm"
            value={copy}
            label=""
            aria-label={`Copy ${label}`}
          />
        )}
      </span>
    </>
  );
}

function AnimatedSizeReadout({ px, unit }: { px: number; unit: SizeUnit }) {
  if (unit === 'rem') {
    return (
      <span className="font-mono tabular">
        <AnimatedNumber value={px / 16} decimals={3} suffix="rem" />
        <span className="text-fg-dim"> · </span>
        <AnimatedNumber value={px} decimals={1} suffix="px" />
      </span>
    );
  }
  if (unit === 'em') {
    return (
      <span className="font-mono tabular">
        <AnimatedNumber value={px / 16} decimals={3} suffix="em" />
      </span>
    );
  }
  return (
    <span className="font-mono tabular">
      <AnimatedNumber value={px} decimals={2} suffix="px" />
    </span>
  );
}

function renderSize(px: number, unit: SizeUnit, _data: ElementTypography): string {
  if (unit === 'rem') return pxToRem(px);
  if (unit === 'em') return `${round(px / 16, 3)}em`;
  return `${round(px, 2)}px`;
}
