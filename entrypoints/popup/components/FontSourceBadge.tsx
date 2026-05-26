import { motion } from 'framer-motion';
import { Globe, FileDown, Sparkles, Cpu, HelpCircle } from 'lucide-react';
import { Badge } from './ui/Badge';
import type { FontSource } from '../../../src/shared/types';

const META: Record<
  FontSource,
  { label: string; Icon: typeof Globe; variant: 'accent' | 'neutral' | 'ok' }
> = {
  google: { label: 'Google', Icon: Globe, variant: 'accent' },
  adobe: { label: 'Adobe', Icon: Sparkles, variant: 'accent' },
  'self-hosted': { label: 'Self-hosted', Icon: FileDown, variant: 'ok' },
  system: { label: 'System', Icon: Cpu, variant: 'neutral' },
  unknown: { label: 'Unknown', Icon: HelpCircle, variant: 'neutral' },
};

export function FontSourceBadge({
  source,
  loaded,
  variable,
}: {
  source: FontSource;
  loaded?: boolean;
  variable?: boolean;
}) {
  const { label, Icon, variant } = META[source];
  return (
    <span className="inline-flex items-center gap-1">
      <Badge variant={variant}>
        <Icon size={9} strokeWidth={2.4} />
        {label}
      </Badge>
      {loaded && (
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        >
          <Badge variant="ok">
            <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-ok">
              <span className="absolute inset-0 animate-ping rounded-full bg-ok/40" />
            </span>
            Loaded
          </Badge>
        </motion.span>
      )}
      {variable && <Badge variant="accent">Variable</Badge>}
    </span>
  );
}
