import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from './cn';

const buttonStyles = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-0',
  {
    variants: {
      variant: {
        // text-accent-contrast keeps text legible on both the #004BD1
        // light-mode and #5a95ff dark-mode accents.
        primary:
          'bg-accent text-accent-contrast hover:bg-accent-hover active:bg-accent-hover',
        secondary:
          'bg-bg-elev text-fg border border-line hover:bg-bg-elev-2 hover:border-accent/40',
        // Ghost stays subtle but the icon must be readable: text-fg in both
        // modes (was text-fg-muted which faded into the background on small
        // icon-only copy buttons).
        ghost: 'text-fg hover:bg-bg-elev hover:text-accent',
        outline:
          'border border-line text-fg hover:bg-bg-elev hover:border-accent/40',
        link: 'text-accent underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-7 px-2.5 text-xs',
        md: 'h-9 px-3.5 text-sm',
        lg: 'h-11 px-5 text-base',
        icon: 'h-9 w-9 p-0',
        'icon-sm': 'h-7 w-7 p-0',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children'>,
    VariantProps<typeof buttonStyles> {
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className={cn(buttonStyles({ variant, size }), className)}
        {...props}
      >
        {children}
      </motion.button>
    );
  },
);
Button.displayName = 'Button';
