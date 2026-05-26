import { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import type { ElementTypography, ThemeName } from '../../shared/types';
import { copyText } from '../../shared/clipboard';

export interface PinnedCard {
  id: string;
  data: ElementTypography;
  /** Document-coordinate position (page-relative, scrolls with the page). */
  documentX: number;
  documentY: number;
}

export interface OverlayProps {
  /** Latest hovered element typography — null when nothing is being hovered. */
  data: ElementTypography | null;
  /** Floating tooltip position (viewport-coords, updated on mousemove). */
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  /** Window scroll position (motion values, updated on scroll). */
  scrollX: MotionValue<number>;
  scrollY: MotionValue<number>;
  /** True when the cursor has produced at least one position update. */
  pointerReady: boolean;
  /** List of cards pinned via click. */
  pinned: PinnedCard[];
  onUnpin: (id: string) => void;
  theme: ThemeName;
}

/**
 * Onylogy Font Checker overlay.
 *
 * Floating tooltip = viewport-anchored, follows the cursor exactly (1:1).
 * Pinned cards = document-anchored, scroll with the page content. They're
 * positioned with motion values derived from `documentX/Y - scrollX/Y` so
 * scrolling never triggers a React render — the transforms update natively.
 */
export function Overlay({
  data,
  pointerX,
  pointerY,
  scrollX,
  scrollY,
  pointerReady,
  pinned,
  onUnpin,
  theme,
}: OverlayProps) {
  return (
    <div className="overlay-root" data-theme={theme}>
      <AnimatePresence>
        {pinned.map((card) => (
          <PinnedCardView
            key={card.id}
            card={card}
            scrollX={scrollX}
            scrollY={scrollY}
            onUnpin={() => onUnpin(card.id)}
          />
        ))}
      </AnimatePresence>
      <FloatingCard
        data={data}
        pointerX={pointerX}
        pointerY={pointerY}
        pointerReady={pointerReady}
      />
    </div>
  );
}

/* ─────────────────────────  Floating tooltip  ────────────────────────── */

function FloatingCard({
  data,
  pointerX,
  pointerY,
  pointerReady,
}: {
  data: ElementTypography | null;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  pointerReady: boolean;
}) {
  if (!data || !pointerReady) return null;

  const family = data.family.primary || data.family.generic || '—';

  return (
    <AnimatePresence>
      <motion.div
        key={data.selector + data.fontSizePx}
        className="card hover"
        style={{ x: pointerX, y: pointerY }}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.12, ease: 'easeOut' }}
      >
        <div className="floating-body">
          <span className="accent-dot" />
          <span className="font-name">{family}</span>
        </div>
        <div className="pin-hint">
          <span className="kbd">Click</span>
          <span>to pin · </span>
          <span className="kbd">Esc</span>
          <span>to exit</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─────────────────────────  Pinned card  ─────────────────────────────── */

function PinnedCardView({
  card,
  scrollX,
  scrollY,
  onUnpin,
}: {
  card: PinnedCard;
  scrollX: MotionValue<number>;
  scrollY: MotionValue<number>;
  onUnpin: () => void;
}) {
  // Viewport coords = document coords - current scroll. Use motion-value
  // transforms so scroll updates don't trigger React re-renders.
  const x = useTransform(scrollX, (sx) => card.documentX - sx);
  const y = useTransform(scrollY, (sy) => card.documentY - sy);

  return (
    <motion.div
      className="card pinned"
      style={{ x, y }}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 360, damping: 30 }}
    >
      <button
        type="button"
        className="close-btn"
        onClick={onUnpin}
        aria-label="Close pinned card"
        title="Close"
      >
        <svg viewBox="0 0 24 24">
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="18" y1="6" x2="6" y2="18" />
        </svg>
      </button>
      <CardBody data={card.data} />
    </motion.div>
  );
}

/* ─────────────────────────  Pinned card body  ───────────────────────── */

function CardBody({ data }: { data: ElementTypography }) {
  return (
    <div className="card-body">
      <Row
        label="Family"
        copyValue={data.family.primary || data.family.generic || ''}
      >
        <span className="accent-dot" />
        <span>{data.family.primary || data.family.generic || '—'}</span>
      </Row>

      <Row label="Weight" copyValue={String(data.fontWeight)}>
        <span>{data.fontWeight}</span>
      </Row>

      <Row label="Size" copyValue={`${round(data.fontSizePx, 2)}px`}>
        <span>{round(data.fontSizePx, 2)}px</span>
      </Row>

      <Row
        label="Line"
        copyValue={
          data.lineHeightPx == null
            ? 'normal'
            : `${round(data.lineHeightPx, 2)}px`
        }
      >
        {data.lineHeightPx == null ? (
          <span className="dim-text">normal</span>
        ) : (
          <span>
            {round(data.lineHeightPx, 2)}px ·{' '}
            <span style={{ opacity: 0.7 }}>
              {round(data.lineHeightRatio ?? 0, 2)}
            </span>
          </span>
        )}
      </Row>

      <Row
        label="Tracking"
        copyValue={`${round(data.letterSpacingEm, 3)}em`}
        dim={data.letterSpacingEm === 0}
      >
        <span>{round(data.letterSpacingEm, 3)}em</span>
      </Row>

      {data.color && (
        <Row label="Color" copyValue={data.color}>
          <span className="color-swatch" style={{ background: data.color }} />
          <span>{data.color.toUpperCase()}</span>
        </Row>
      )}

      {data.textTransform !== 'none' && (
        <Row label="Transform" copyValue={data.textTransform}>
          <span>{data.textTransform}</span>
        </Row>
      )}
    </div>
  );
}

function Row({
  label,
  children,
  copyValue,
  dim,
}: {
  label: string;
  children: React.ReactNode;
  copyValue?: string;
  dim?: boolean;
}) {
  return (
    <div className="row">
      <span className="label">{label}</span>
      <span className={`value ${dim ? 'dim' : ''}`}>{children}</span>
      {copyValue ? <CopyIcon value={copyValue} /> : <span />}
    </div>
  );
}

function CopyIcon({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const handle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await copyText(value);
    if (!ok) return;
    setCopied(true);
    if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <button
      type="button"
      className={`copy-btn${copied ? ' copied' : ''}`}
      onClick={handle}
      aria-label={copied ? 'Copied' : `Copy ${value}`}
      title={copied ? 'Copied' : 'Copy'}
    >
      {copied ? (
        <svg viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

function round(n: number, decimals = 2) {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}
