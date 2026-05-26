import type {
  A11yReport,
  ElementTypography,
  HierarchyReport,
} from './types';

/* ──────────────────────────  Toast payload  ───────────────────────────── */

export interface ToastPayload {
  message: string;
  tone?: 'success' | 'error';
  /** Optional emphasis value rendered in mono after the message. */
  value?: string;
}

/* ──────────────────────────  Result wrappers  ─────────────────────────── */

export type InspectAtPointResult =
  | { ok: true; data: ElementTypography }
  | { ok: false; reason: 'unsupported' | 'error'; message?: string };

export type ExtractHierarchyResult =
  | { ok: true; result: HierarchyReport }
  | { ok: false; reason: 'unsupported' | 'error'; message?: string };

export type AnalyzeAccessibilityResult =
  | { ok: true; result: A11yReport }
  | { ok: false; reason: 'error' | 'no-hierarchy'; message?: string };

/* ─────────────────────────  Runtime messages  ─────────────────────────── */

export type RuntimeMsg =
  | { type: 'PING' }
  | { type: 'SHOW_TOAST'; payload: ToastPayload }
  | { type: 'EXTRACT_HIERARCHY'; options?: { minArea?: number } }
  | { type: 'ANALYZE_ACCESSIBILITY' }
  | { type: 'INSPECT_AT_POINT'; x: number; y: number }
  | { type: 'INSPECT_START' }
  | { type: 'INSPECT_STOP' }
  | { type: 'INSPECT_STATUS_QUERY' }
  | { type: 'CLEAR_PINS' };

export type RuntimeReply =
  | { type: 'PONG'; supported: boolean }
  | { type: 'TOAST_ACK' }
  | { type: 'EXTRACT_HIERARCHY_RESULT'; payload: ExtractHierarchyResult }
  | { type: 'ANALYZE_ACCESSIBILITY_RESULT'; payload: AnalyzeAccessibilityResult }
  | { type: 'INSPECT_AT_POINT_RESULT'; payload: InspectAtPointResult }
  | { type: 'INSPECT_STATUS'; active: boolean; pinCount: number }
  | { type: 'CLEAR_PINS_ACK' };

/* ─────────────────────────  Port (live hover)  ────────────────────────── */

export type PortMsg =
  | { type: 'INSPECT_START' }
  | { type: 'INSPECT_STOP' }
  | { type: 'HOVER'; payload: ElementTypography };

/** Port name used for the persistent live-hover stream. */
export const INSPECT_PORT = 'onylogy-type-inspect';

/* ─────────────────────────  Send helpers  ─────────────────────────────── */

export async function sendToActiveTab<T extends RuntimeMsg, R extends RuntimeReply>(
  msg: T,
): Promise<R | { type: 'NO_TAB' } | { type: 'PAGE_UNSUPPORTED' }> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return { type: 'NO_TAB' };
  if (!isInjectablePage(tab.url)) return { type: 'PAGE_UNSUPPORTED' };
  try {
    return (await chrome.tabs.sendMessage(tab.id, msg)) as R;
  } catch {
    return { type: 'PAGE_UNSUPPORTED' };
  }
}

export function isInjectablePage(url: string | undefined): boolean {
  if (!url) return false;
  return (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('file://')
  );
}
