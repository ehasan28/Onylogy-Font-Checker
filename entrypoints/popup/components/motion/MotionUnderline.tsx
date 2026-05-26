import { motion } from 'framer-motion';
import { cn } from '../ui/cn';

/**
 * Shared underline that can be morphed between sibling items via Framer's
 * `layoutId`. Pass the SAME `layoutId` to a group of items and Framer will
 * animate the underline as the active item changes.
 *
 * Used in places where Radix's data-state attributes don't fit the layout
 * (e.g. custom segmented controls). Tabs already uses an internal version.
 */
export function MotionUnderline({
  layoutId,
  className,
}: {
  layoutId: string;
  className?: string;
}) {
  return (
    <motion.span
      layoutId={layoutId}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className={cn('block h-[2px] w-full rounded bg-accent', className)}
    />
  );
}
