import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';

export interface SlideUpProps extends HTMLMotionProps<'div'> {
  delay?: number;
  distance?: number;
}

/**
 * Fade + small slide-up entrance. Used for tab panels and section reveals.
 * Tuned to a snappy ~220ms easing.
 */
export function SlideUp({
  delay = 0,
  distance = 6,
  children,
  ...rest
}: SlideUpProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: distance }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, y: -distance / 2 }}
      transition={{
        delay,
        duration: reduce ? 0 : 0.22,
        ease: [0.2, 0.65, 0.3, 1],
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
