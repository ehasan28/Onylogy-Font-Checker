import { motion } from 'framer-motion';
import { MousePointerClick, Sparkles } from 'lucide-react';
import { SlideUp } from '../components/motion/SlideUp';
import { StaggerList } from '../components/motion/StaggerList';
import { TypographyCard } from '../components/TypographyCard';
import { UnitToggle } from '../components/UnitToggle';
import { Button } from '../components/ui/Button';
import { Kbd } from '../components/ui/Kbd';
import { FontChip } from '../components/FontChip';
import type { ElementTypography, SizeUnit } from '../../../src/shared/types';

export interface DashboardTabProps {
  data: ElementTypography | null;
  unit: SizeUnit;
  onUnitChange: (next: SizeUnit) => void;
  recentFonts: string[];
  inspectArmed: boolean;
  onToggleInspect: () => void;
}

export function DashboardTab({
  data,
  unit,
  onUnitChange,
  recentFonts,
  inspectArmed,
  onToggleInspect,
}: DashboardTabProps) {
  return (
    <SlideUp className="space-y-5 p-5">
      {/* Header row: live indicator + unit toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full"
            style={{
              background: inspectArmed
                ? 'var(--accent)'
                : 'var(--fg-dim)',
            }}
            animate={
              inspectArmed
                ? {
                    opacity: [1, 0.4, 1],
                    scale: [1, 1.2, 1],
                  }
                : { opacity: 1, scale: 1 }
            }
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <p className="text-[11px] uppercase tracking-wider text-fg-dim">
            {inspectArmed ? 'Live' : 'Paused'}
          </p>
        </div>
        <UnitToggle value={unit} onChange={onUnitChange} />
      </div>

      {/* Live typography card */}
      <TypographyCard data={data} unit={unit} />

      {/* Inspect button when not armed */}
      {!inspectArmed && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-line border-dashed bg-bg-elev/40 p-4 text-center"
        >
          <p className="font-display text-lg leading-tight text-fg">
            Ready to inspect?
          </p>
          <p className="mt-1 text-[11px] text-fg-muted">
            Click <Kbd>I</Kbd> or the button below to stream typography from the page.
          </p>
          <Button
            className="mt-3"
            variant="primary"
            size="sm"
            onClick={onToggleInspect}
          >
            <MousePointerClick size={13} strokeWidth={2.2} />
            <span>Start inspecting</span>
          </Button>
        </motion.div>
      )}

      {/* Recent fonts — appears once we've inspected something */}
      {recentFonts.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider text-fg-dim">
              Recent fonts
            </p>
            <Sparkles size={11} strokeWidth={2} className="text-fg-dim" />
          </div>
          <StaggerList className="flex flex-wrap gap-1.5" stagger={0.03}>
            {recentFonts.slice(0, 12).map((f) => (
              <FontChip key={f} family={f} />
            ))}
          </StaggerList>
        </div>
      )}
    </SlideUp>
  );
}
