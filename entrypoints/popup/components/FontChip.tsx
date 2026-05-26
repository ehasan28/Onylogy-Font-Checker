import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Copy } from 'lucide-react';
import { copyText } from '../../../src/shared/clipboard';
import { cn } from './ui/cn';

/**
 * Compact recent-font chip. Shows the font family in its OWN typeface
 * (so the user sees a tiny live preview) and copies the family name on
 * click. Copy state morphs from a hover-only copy icon to a confirmation
 * check icon for ~1.2s.
 *
 * Previously this was a CopyButton with the family name as the label,
 * which crowded the readout with an icon and truncated longer names.
 */
export function FontChip({ family }: { family: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const handle = useCallback(async () => {
    const ok = await copyText(family);
    if (!ok) return;
    setCopied(true);
    if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setCopied(false), 1200);
  }, [family]);

  return (
    <motion.button
      type="button"
      onClick={handle}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
      className={cn(
        'group inline-flex items-center gap-1.5 rounded-full border border-line bg-bg-elev px-3 py-1 text-fg transition-colors',
        'hover:border-accent hover:bg-accent-soft hover:text-accent',
        copied && 'border-accent bg-accent-soft text-accent',
      )}
      title={copied ? 'Copied' : `Copy "${family}"`}
      aria-label={copied ? 'Copied' : `Copy ${family}`}
    >
      {/* The font name renders in ITS OWN family so the chip doubles as a
          tiny visual preview. Fallback to sans if the font isn't loaded. */}
      <span
        className="truncate text-[11px] font-medium"
        style={{ fontFamily: `"${family}", var(--sans-font)` }}
      >
        {family}
      </span>
      <span className="flex h-3 w-3 items-center justify-center text-fg-dim opacity-0 transition-opacity group-hover:opacity-100">
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.span
              key="check"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              className="text-accent"
              style={{ opacity: 1 }}
            >
              <Check size={10} strokeWidth={2.6} />
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            >
              <Copy size={10} strokeWidth={2.4} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </motion.button>
  );
}
