import { Children, ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface StaggerListProps {
  children: ReactNode;
  className?: string;
  /** Delay between children appearing (seconds). Default 0.04. */
  stagger?: number;
  /** Initial delay before the first child appears (seconds). */
  delay?: number;
  /** Vertical offset distance each child starts from. */
  distance?: number;
}

/**
 * Cascading entrance for lists. Wraps each direct child in a `motion.div`
 * that springs from `distance` below + opacity 0 to its natural position.
 * When the user prefers reduced motion, all children appear instantly.
 */
export function StaggerList({
  children,
  className,
  stagger = 0.04,
  delay = 0,
  distance = 8,
}: StaggerListProps) {
  const reduce = useReducedMotion();

  const container = {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: { staggerChildren: reduce ? 0 : stagger, delayChildren: delay },
    },
  };
  const item = {
    hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: distance },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 280, damping: 24 },
    },
  };

  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      animate="show"
    >
      {Children.map(children, (child, i) => (
        <motion.div key={i} variants={item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
