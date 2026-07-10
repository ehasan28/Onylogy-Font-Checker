/**
 * Content script — message dispatcher and overlay host.
 *
 * Inspect mode is **independent of the popup's lifetime**: the popup sends
 * one-shot INSPECT_START / INSPECT_STOP messages, and the content script
 * keeps the overlay + hover/click handlers running until told to stop.
 *
 * The persistent port `onylogy-type-inspect` is still used to MIRROR live
 * hover data into the popup's TypographyCard while the popup is open. When
 * the port disconnects (popup closes), inspect mode CONTINUES — the user
 * can keep hovering and clicking on the page without losing state.
 */

import { showPageToast } from '../src/content/toast';
import {
  collectTypography,
  startInspector,
  stopInspector,
} from '../src/content/typography-inspector';
import { mountOverlay, type OverlayHandle } from '../src/content/overlay/mount';
import { extractHierarchy } from '../src/content/hierarchy-extractor';
import { analyzeAccessibility } from '../src/content/accessibility-analyzer';
import {
  INSPECT_PORT,
  type RuntimeMsg,
  type RuntimeReply,
} from '../src/shared/messaging';
import { getPrefs } from '../src/shared/storage';
import type { ElementTypography, HierarchyReport, ThemeName } from '../src/shared/types';

let lastHierarchyReport: HierarchyReport | null = null;

export default defineContentScript({
  // `registration: 'runtime'` tells WXT to BUILD this script as a standalone
  // bundle but NOT to declare it under `content_scripts` in the manifest.
  // The popup and background both inject it on demand via
  // chrome.scripting.executeScript when the user invokes the extension —
  // so the extension only touches a tab when the user explicitly opts in.
  //
  // Without this, the manifest declares `<all_urls>` matches and Chrome
  // Web Store flags the listing with "Because of the host permission, your
  // extension may require an in-depth review", delaying publication.
  registration: 'runtime',
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  cssInjectionMode: 'manual',
  main() {
    let overlay: OverlayHandle | null = null;
    let inspectActive = false;
    let livePort: chrome.runtime.Port | null = null;
    let latestHover: ElementTypography | null = null;

    // ─────────────────  Inspect lifecycle  ───────────────────
    async function enableInspect() {
      if (inspectActive) return;
      inspectActive = true;
      if (!overlay) overlay = mountOverlay();

      // Apply theme from storage so first frame matches the popup.
      try {
        const prefs = await getPrefs();
        overlay?.setTheme(prefs.theme as ThemeName);
      } catch {
        /* defaults to light */
      }

      startInspector(
        // Hover — only updates the data; position follows the cursor
        // independently inside the overlay mount layer.
        (data) => {
          latestHover = data;
          try {
            livePort?.postMessage({ type: 'HOVER', payload: data });
          } catch {
            /* port already closed — fine, inspect continues */
          }
          overlay?.update(data);
        },
        // Click → pin a card at the click position.
        (data, position) => {
          overlay?.pin(data, position);
        },
        // Escape → exit inspect mode AND clear all pinned cards.
        // (User asked for full reset on Esc — see v0.2.x change log.)
        () => disableInspect(),
      );
    }

    function disableInspect(opts?: { keepPins?: boolean }) {
      if (!inspectActive) return;
      inspectActive = false;
      stopInspector();

      const hasPins = (overlay?.pinCount() ?? 0) > 0;
      if (opts?.keepPins && hasPins) {
        // Pinned cards remain visible — just hide the floating tooltip.
        overlay?.hideHover();
      } else {
        overlay?.destroy();
        overlay = null;
      }
      latestHover = null;

      // Tell the popup (if open) so its button state stays in sync.
      try {
        livePort?.postMessage({
          type: 'INSPECT_STATUS',
          active: false,
          pinCount: overlay?.pinCount() ?? 0,
        });
      } catch {
        /* port closed */
      }
    }

    // ─────────────────  Theme sync (popup → page)  ───────────
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      const next = changes['onylogy-type.prefs']?.newValue as
        | { theme?: ThemeName }
        | undefined;
      if (next?.theme === 'light' || next?.theme === 'dark') {
        overlay?.setTheme(next.theme);
      }
    });

    // ─────────────────  Runtime message dispatcher  ──────────
    chrome.runtime.onMessage.addListener((msg: RuntimeMsg, _sender, sendResponse) => {
      if (!msg || typeof msg !== 'object') return false;

      if (msg.type === 'PING') {
        const reply: RuntimeReply = { type: 'PONG', supported: true };
        sendResponse(reply);
        return false;
      }

      if (msg.type === 'INSPECT_START') {
        enableInspect();
        const reply: RuntimeReply = {
          type: 'INSPECT_STATUS',
          active: true,
          pinCount: overlay?.pinCount() ?? 0,
        };
        sendResponse(reply);
        return false;
      }

      if (msg.type === 'INSPECT_STOP') {
        disableInspect();
        const reply: RuntimeReply = { type: 'INSPECT_STATUS', active: false, pinCount: 0 };
        sendResponse(reply);
        return false;
      }

      if (msg.type === 'INSPECT_STATUS_QUERY') {
        const reply: RuntimeReply = {
          type: 'INSPECT_STATUS',
          active: inspectActive,
          pinCount: overlay?.pinCount() ?? 0,
        };
        sendResponse(reply);
        return false;
      }

      if (msg.type === 'CLEAR_PINS') {
        overlay?.clearPins();
        const reply: RuntimeReply = { type: 'CLEAR_PINS_ACK' };
        sendResponse(reply);
        return false;
      }

      if (msg.type === 'SHOW_TOAST') {
        showPageToast(msg.payload.message, {
          tone: msg.payload.tone,
          value: msg.payload.value,
        });
        const reply: RuntimeReply = { type: 'TOAST_ACK' };
        sendResponse(reply);
        return false;
      }

      if (msg.type === 'INSPECT_AT_POINT') {
        const el = document.elementFromPoint(msg.x, msg.y);
        if (el) {
          const data = collectTypography(el);
          const reply: RuntimeReply = {
            type: 'INSPECT_AT_POINT_RESULT',
            payload: { ok: true, data },
          };
          sendResponse(reply);
        } else {
          const reply: RuntimeReply = {
            type: 'INSPECT_AT_POINT_RESULT',
            payload: { ok: false, reason: 'error', message: 'No element at point' },
          };
          sendResponse(reply);
        }
        return false;
      }

      if (msg.type === 'EXTRACT_HIERARCHY') {
        extractHierarchy(msg.options ?? {})
          .then((result) => {
            lastHierarchyReport = result;
            const reply: RuntimeReply = {
              type: 'EXTRACT_HIERARCHY_RESULT',
              payload: { ok: true, result },
            };
            sendResponse(reply);
          })
          .catch((err: unknown) => {
            const reply: RuntimeReply = {
              type: 'EXTRACT_HIERARCHY_RESULT',
              payload: {
                ok: false,
                reason: 'error',
                message: err instanceof Error ? err.message : String(err),
              },
            };
            sendResponse(reply);
          });
        return true;
      }

      if (msg.type === 'ANALYZE_ACCESSIBILITY') {
        const run = async () => {
          try {
            const hierarchy = lastHierarchyReport ?? (await extractHierarchy({}));
            lastHierarchyReport = hierarchy;
            const result = analyzeAccessibility(hierarchy);
            const reply: RuntimeReply = {
              type: 'ANALYZE_ACCESSIBILITY_RESULT',
              payload: { ok: true, result },
            };
            sendResponse(reply);
          } catch (err) {
            const reply: RuntimeReply = {
              type: 'ANALYZE_ACCESSIBILITY_RESULT',
              payload: {
                ok: false,
                reason: 'error',
                message: err instanceof Error ? err.message : String(err),
              },
            };
            sendResponse(reply);
          }
        };
        run();
        return true;
      }

      return false;
    });

    // ─────────────────  Live mirror port (popup-side)  ───────
    // The popup opens this port to receive a HOVER stream. When the popup
    // closes the port disconnects, but inspect mode keeps running.
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name !== INSPECT_PORT) return;
      livePort = port;

      // Catch the popup up to the latest hover.
      if (latestHover) {
        try {
          port.postMessage({ type: 'HOVER', payload: latestHover });
        } catch {
          /* noop */
        }
      }

      port.onDisconnect.addListener(() => {
        if (livePort === port) livePort = null;
        // Intentionally NOT calling disableInspect — the page-side inspector
        // continues so the user can keep hovering / clicking after the
        // popup closes.
      });
    });
  },
});
