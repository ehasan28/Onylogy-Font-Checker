import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';

export interface FadeInProps extends HTMLMotionProps<'div'> {
  delay?: number;
  duration?: number;
}

/**
 * Simple fade-in wrapper. Respects prefers-reduced-motion by snapping to
 * the final state instantly when the user opts out.
 */
export function FadeIn({
  delay = 0,
  duration = 0.24,
  children,
  ...rest
}: FadeInProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: reduce ? 0 : duration, ease: 'easeOut' }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
