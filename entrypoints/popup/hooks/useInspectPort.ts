import { useCallback, useEffect, useRef, useState } from 'react';
import { INSPECT_PORT, type RuntimeReply } from '../../../src/shared/messaging';
import type { ElementTypography } from '../../../src/shared/types';

/**
 * `useInspectMode` — controls the page-side inspector and mirrors live
 * hover data into the popup.
 *
 * Inspect mode lives on the PAGE, not in the popup. The popup sends a
 * one-shot INSPECT_START / INSPECT_STOP message; the content script keeps
 * the overlay + hover/click handlers running until told to stop. This means
 * the user can close the popup and keep inspecting / pinning cards on the
 * page without any state loss.
 *
 * Separately, while the popup is open, this hook opens a port to mirror
 * the latest hover into the popup's TypographyCard. The port disconnect
 * does NOT stop inspect mode — only an explicit INSPECT_STOP does.
 *
 * On mount, the hook PINGs the tab to discover whether inspect mode is
 * already on (from a prior popup session) so the toggle button reflects
 * reality.
 *
 * Auto-injection: if the content script isn't present on the tab (common
 * when a tab was opened before the extension was installed), we use
 * `chrome.scripting.executeScript` to inject it before connecting.
 */

interface UseInspectMode {
  /** True if inspect mode is currently armed (on the page). */
  active: boolean;
  /** Latest hovered element, mirrored from the page. */
  data: ElementTypography | null;
  /** Number of pinned cards currently on the page. */
  pinCount: number;
  /** Live mirror port is open. */
  connected: boolean;
  /** Last connection error, if any. */
  error: string | null;
  /** Start inspect mode on the page. */
  start: () => Promise<void>;
  /** Stop inspect mode on the page. */
  stop: () => Promise<void>;
  /** Convenience: start if off, stop if on. */
  toggle: () => Promise<void>;
  /** Clear every pinned card on the page. */
  clearPins: () => Promise<void>;
}

export interface UseInspectModeOptions {
  /**
   * If true, automatically start inspect mode on mount when it isn't
   * already running. Used in App.tsx so opening the popup = ready to
   * inspect right away.
   */
  autoStart?: boolean;
}

export function useInspectMode(opts: UseInspectModeOptions = {}): UseInspectMode {
  const [active, setActive] = useState(false);
  const [data, setData] = useState<ElementTypography | null>(null);
  const [pinCount, setPinCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const portRef = useRef<chrome.runtime.Port | null>(null);
  const tabIdRef = useRef<number | null>(null);

  /* ────────────  Helpers  ────────────── */

  const ensureContentScript = useCallback(async (tabId: number): Promise<boolean> => {
    // 1. PING — already running?
    try {
      const reply = await chrome.tabs.sendMessage(tabId, { type: 'PING' });
      if (reply && (reply as { type?: string }).type === 'PONG') return true;
    } catch {
      /* not loaded yet */
    }
    // 2. Inject from the packaged bundle.
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['/content-scripts/content.js'],
      });
      // Brief settle so the message listener is registered.
      await new Promise((r) => setTimeout(r, 80));
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not inject the inspector into this page.',
      );
      return false;
    }
  }, []);

  const openLivePort = useCallback((tabId: number) => {
    if (portRef.current) return;
    try {
      const port = chrome.tabs.connect(tabId, { name: INSPECT_PORT });
      portRef.current = port;
      setConnected(true);

      port.onMessage.addListener(
        (msg: {
          type?: string;
          payload?: ElementTypography;
          active?: boolean;
          pinCount?: number;
        }) => {
          if (msg?.type === 'HOVER' && msg.payload) {
            setData(msg.payload);
            return;
          }
          // Page-side state change (Escape, programmatic, etc.) — mirror it
          // into the popup so the inspect button toggles correctly.
          if (msg?.type === 'INSPECT_STATUS') {
            if (typeof msg.active === 'boolean') setActive(msg.active);
            if (typeof msg.pinCount === 'number') setPinCount(msg.pinCount);
            if (msg.active === false) {
              setData(null);
            }
          }
        },
      );

      port.onDisconnect.addListener(() => {
        if (portRef.current === port) {
          portRef.current = null;
          setConnected(false);
        }
      });
    } catch (err) {
      console.warn('[Onylogy Font Checker] live port connect failed:', err);
      setConnected(false);
    }
  }, []);

  /* ────────────  Mount: hydrate status from the page  ──────── */

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (cancelled) return;
      if (!tab?.id) {
        setError('No active tab.');
        return;
      }
      tabIdRef.current = tab.id;

      const ok = await ensureContentScript(tab.id);
      if (cancelled || !ok) return;

      try {
        const reply = (await chrome.tabs.sendMessage(tab.id, {
          type: 'INSPECT_STATUS_QUERY',
        })) as RuntimeReply | undefined;
        if (cancelled) return;
        if (reply && reply.type === 'INSPECT_STATUS') {
          setActive(reply.active);
          setPinCount(reply.pinCount);

          if (reply.active) {
            // Already running from a prior session — just open the live
            // mirror so the popup catches up.
            openLivePort(tab.id);
          } else if (opts.autoStart) {
            // Auto-arm inspect on popup open (clicking the toolbar icon
            // = ready to inspect, per spec).
            try {
              const started = (await chrome.tabs.sendMessage(tab.id, {
                type: 'INSPECT_START',
              })) as RuntimeReply | undefined;
              if (cancelled) return;
              if (started && started.type === 'INSPECT_STATUS') {
                setActive(started.active);
                setPinCount(started.pinCount);
              }
              openLivePort(tab.id);
            } catch (err) {
              if (!cancelled) {
                setError(err instanceof Error ? err.message : 'Could not start inspect.');
              }
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Connection failed.');
        }
      }
    })();

    return () => {
      cancelled = true;
      portRef.current?.disconnect();
      portRef.current = null;
      setConnected(false);
    };
  }, [ensureContentScript, openLivePort, opts.autoStart]);

  /* ────────────  Public actions  ──────── */

  const start = useCallback(async () => {
    setError(null);
    const tabId = tabIdRef.current;
    if (tabId == null) return;
    const ok = await ensureContentScript(tabId);
    if (!ok) return;
    try {
      const reply = (await chrome.tabs.sendMessage(tabId, {
        type: 'INSPECT_START',
      })) as RuntimeReply | undefined;
      if (reply && reply.type === 'INSPECT_STATUS') {
        setActive(reply.active);
        setPinCount(reply.pinCount);
      }
      openLivePort(tabId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed.');
    }
  }, [ensureContentScript, openLivePort]);

  const stop = useCallback(async () => {
    setError(null);
    const tabId = tabIdRef.current;
    if (tabId == null) return;
    portRef.current?.disconnect();
    portRef.current = null;
    setConnected(false);
    try {
      const reply = (await chrome.tabs.sendMessage(tabId, {
        type: 'INSPECT_STOP',
      })) as RuntimeReply | undefined;
      if (reply && reply.type === 'INSPECT_STATUS') {
        setActive(reply.active);
        setPinCount(reply.pinCount);
      }
      setData(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not stop inspect.');
    }
  }, []);

  const toggle = useCallback(async () => {
    if (active) await stop();
    else await start();
  }, [active, start, stop]);

  const clearPins = useCallback(async () => {
    const tabId = tabIdRef.current;
    if (tabId == null) return;
    try {
      await chrome.tabs.sendMessage(tabId, { type: 'CLEAR_PINS' });
      setPinCount(0);
    } catch {
      /* ignore */
    }
  }, []);

  return { active, data, pinCount, connected, error, start, stop, toggle, clearPins };
}
