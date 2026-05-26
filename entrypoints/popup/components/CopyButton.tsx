import { useCallback, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { copyText } from '../../../src/shared/clipboard';
import { Button, type ButtonProps } from './ui/Button';
import { cn } from './ui/cn';

export interface CopyButtonProps extends Omit<ButtonProps, 'children' | 'onClick'> {
  value: string;
  label?: string;
  onCopied?: (value: string) => void;
}

/**
 * Button that copies `value` to the clipboard and morphs its icon
 * Copy → Check → Copy with a small spring. Resets after ~1.4s.
 *
 * When `label` is falsy the button renders as a compact icon-only square
 * (no min-width). When a label is provided we add a comfortable min-width
 * so single-word labels don't reflow.
 */
export function CopyButton({
  value,
  label = 'Copy',
  onCopied,
  className,
  size = 'md',
  ...buttonProps
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const iconOnly = !label;

  const handle = useCallback(async () => {
    const ok = await copyText(value);
    if (!ok) return;
    setCopied(true);
    onCopied?.(value);
    window.setTimeout(() => setCopied(false), 1400);
  }, [value, onCopied]);

  return (
    <Button
      onClick={handle}
      aria-label={copied ? 'Copied' : `Copy ${value}`}
      size={size}
      className={cn(!iconOnly && 'min-w-20', className)}
      {...buttonProps}
    >
      <span className="relative flex h-4 w-4 items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.span
              key="check"
              initial={{ scale: 0.6, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.6, opacity: 0, rotate: 20 }}
              transition={{ type: 'spring', stiffness: 420, damping: 26 }}
              className="absolute"
            >
              <Check size={14} strokeWidth={2.4} />
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={{ scale: 0.6, opacity: 0, rotate: 20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.6, opacity: 0, rotate: -20 }}
              transition={{ type: 'spring', stiffness: 420, damping: 26 }}
              className="absolute"
            >
              <Copy size={14} strokeWidth={2.2} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      {!iconOnly && (
        <span className="tabular text-xs">{copied ? 'Copied' : label}</span>
      )}
    </Button>
  );
}
