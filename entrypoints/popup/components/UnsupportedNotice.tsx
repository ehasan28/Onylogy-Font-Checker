import { ShieldAlert } from 'lucide-react';
import { FadeIn } from './motion/FadeIn';

/**
 * Rendered when the popup opens on a chrome:// or about: page where content
 * scripts cannot be injected. Friendly explanation + suggested next step.
 */
export function UnsupportedNotice() {
  return (
    <FadeIn className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-bg-elev text-fg-muted">
        <ShieldAlert size={18} strokeWidth={1.8} />
      </span>
      <h2 className="font-display text-2xl font-semibold text-fg">Not available here</h2>
      <p className="max-w-[260px] text-xs leading-relaxed text-fg-muted">
        Onylogy Font Checker reads the rendered DOM, so it only runs on regular
        web pages. Open any website and try again.
      </p>
    </FadeIn>
  );
}
