import { createContext, forwardRef, useContext } from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle-group';
import { motion } from 'framer-motion';
import { cn } from './cn';

/**
 * ToggleGroup with an animated selection chip that slides between items.
 * The chip is a single `motion.div layoutId="toggle-chip"` rendered inside
 * the active item — Framer's layout animation morphs it across positions.
 *
 * Use a unique `layoutGroupId` prop on `ToggleGroup` when you have multiple
 * groups on screen at once (otherwise their chips would share a layoutId
 * and try to morph across groups).
 */

interface CtxValue {
  layoutId: string;
}
const Ctx = createContext<CtxValue>({ layoutId: 'toggle-chip' });

type ToggleGroupRootProps = React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & {
  layoutGroupId?: string;
};

export const ToggleGroup = forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  ToggleGroupRootProps
>((props, ref) => {
  const { className, layoutGroupId, children, ...rest } = props as ToggleGroupRootProps & {
    className?: string;
    children?: React.ReactNode;
  };
  const id = layoutGroupId ?? 'toggle-chip';
  return (
    <Ctx.Provider value={{ layoutId: id }}>
      <TogglePrimitive.Root
        ref={ref}
        className={cn(
          'inline-flex items-center gap-0.5 rounded-full border border-line bg-bg-elev p-0.5',
          className,
        )}
        {...(rest as any)}
      >
        {children}
      </TogglePrimitive.Root>
    </Ctx.Provider>
  );
});
ToggleGroup.displayName = 'ToggleGroup';

export const ToggleGroupItem = forwardRef<
  React.ElementRef<typeof TogglePrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Item>
>(({ className, children, ...props }, ref) => {
  const { layoutId } = useContext(Ctx);
  return (
    <TogglePrimitive.Item
      ref={ref}
      className={cn(
        // text-accent-contrast (white) reads on the blue chip in both themes.
        'group relative inline-flex h-7 min-w-7 items-center justify-center rounded-full px-3 text-xs font-medium text-fg-muted transition-colors hover:text-fg data-[state=on]:text-accent-contrast',
        className,
      )}
      {...props}
    >
      {/* Animated chip — only rendered on the active item */}
      <span className="absolute inset-0 hidden rounded-full group-data-[state=on]:block">
        <motion.span
          layoutId={layoutId}
          className="block h-full w-full rounded-full bg-accent"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      </span>
      <span className="relative z-10">{children}</span>
    </TogglePrimitive.Item>
  );
});
ToggleGroupItem.displayName = 'ToggleGroupItem';
