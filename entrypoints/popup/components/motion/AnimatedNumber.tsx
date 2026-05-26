import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';

export interface AnimatedNumberProps {
  value: number;
  /** Decimal places to render. Default 0. */
  decimals?: number;
  /** Optional suffix (e.g. "px", "em"). */
  suffix?: string;
  /** Optional prefix. */
  prefix?: string;
  className?: string;
}

/**
 * Smoothly interpolates between numeric values when `value` changes.
 * Falls back to instant updates when the user prefers reduced motion.
 */
export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = '',
  prefix = '',
  className,
}: AnimatedNumberProps) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  const spring = useSpring(mv, { stiffness: 260, damping: 28, mass: 0.4 });
  const display = useTransform(spring, (v) => `${prefix}${v.toFixed(decimals)}${suffix}`);
  const spanRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (reduce) {
      mv.set(value);
    } else {
      mv.set(value);
    }
  }, [value, mv, reduce]);

  // We subscribe to the motion-value-derived string and write it to the span.
  useEffect(() => {
    const unsub = display.on('change', (v) => {
      if (spanRef.current) spanRef.current.textContent = v;
    });
    // Set initial
    if (spanRef.current) spanRef.current.textContent = display.get();
    return unsub;
  }, [display]);

  return (
    <motion.span ref={spanRef} className={className}>
      {`${prefix}${value.toFixed(decimals)}${suffix}`}
    </motion.span>
  );
}
