/**
 * Robust clipboard write.
 *
 * Tries the modern async `navigator.clipboard.writeText` first. That API
 * requires both a fresh user gesture AND that the document is focused, and
 * Chromium throws a `NotAllowedError` DOMException if either is missing.
 *
 * On failure, falls back to `document.execCommand('copy')` via a hidden,
 * momentarily-focused textarea. The legacy path is synchronous and runs
 * inside the user-gesture window without the focus requirement, so it
 * succeeds in cases where the modern API doesn't.
 *
 * Returns `true` on success, `false` if both methods fail.
 */
export async function copyText(text: string): Promise<boolean> {
  // 1. Modern API — works in most cases.
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    // NotAllowedError when document isn't focused / no transient activation.
    // Fall through to the execCommand fallback.
    console.warn('[Typography Inspector] navigator.clipboard.writeText failed:', err);
  }

  // 2. Fallback: hidden textarea + execCommand('copy').
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText =
      'position:fixed;top:0;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
    document.body.appendChild(ta);
    const savedFocus = document.activeElement as HTMLElement | null;
    ta.focus({ preventScroll: true });
    ta.select();
    ta.setSelectionRange(0, text.length);
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } finally {
      document.body.removeChild(ta);
      try {
        savedFocus?.focus?.({ preventScroll: true });
      } catch {
        /* noop */
      }
    }
    return ok;
  } catch (err) {
    console.warn('[Typography Inspector] execCommand copy fallback failed:', err);
    return false;
  }
}
