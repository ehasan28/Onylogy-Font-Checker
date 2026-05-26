/**
 * Service worker — onInstalled hook + browser-shortcut handler.
 *
 * The `toggle-inspect` command (Alt+Shift+F by default; user-remappable in
 * chrome://extensions/shortcuts) toggles inspect mode on the active tab.
 * We auto-inject the content script if it's not already running, the same
 * fallback the popup uses.
 */

import { isInjectablePage } from '../src/shared/messaging';

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener(() => {
    // Reserved for first-run onboarding.
  });

  chrome.commands.onCommand.addListener(async (command) => {
    if (command !== 'toggle-inspect') return;

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !isInjectablePage(tab.url)) return;
    const tabId = tab.id;

    // Ensure the content script is alive on this tab.
    let alive = false;
    try {
      const pong = await chrome.tabs.sendMessage(tabId, { type: 'PING' });
      alive = !!(pong && (pong as { type?: string }).type === 'PONG');
    } catch {
      alive = false;
    }
    if (!alive) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['/content-scripts/content.js'],
        });
        // Brief settle so the message listener is wired.
        await new Promise((r) => setTimeout(r, 80));
      } catch (err) {
        console.warn('[Onylogy Font Checker] shortcut inject failed:', err);
        return;
      }
    }

    // Toggle based on current state.
    try {
      const status = (await chrome.tabs.sendMessage(tabId, {
        type: 'INSPECT_STATUS_QUERY',
      })) as { type?: string; active?: boolean } | undefined;
      const next = status?.active ? 'INSPECT_STOP' : 'INSPECT_START';
      await chrome.tabs.sendMessage(tabId, { type: next });
    } catch (err) {
      console.warn('[Onylogy Font Checker] shortcut toggle failed:', err);
    }
  });
});
