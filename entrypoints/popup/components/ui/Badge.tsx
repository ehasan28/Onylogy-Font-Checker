import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

const badgeStyles = cva(
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider transition-colors',
  {
    variants: {
      variant: {
        neutral: 'border-line bg-bg-elev text-fg-muted',
        accent: 'border-accent/30 bg-accent-soft text-accent',
        ok: 'border-ok/30 bg-ok/10 text-ok',
        warn: 'border-warn/30 bg-warn/10 text-warn',
        bad: 'border-bad/30 bg-bad/10 text-bad',
      },
    },
    defaultVariants: { variant: 'neutral' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeStyles> {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span ref={ref} className={cn(badgeStyles({ variant }), className)} {...props} />
  ),
);
Badge.displayName = 'Badge';
