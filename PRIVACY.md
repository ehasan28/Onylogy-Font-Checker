# Privacy Policy — Onylogy Font Checker

**Last updated:** May 27, 2026

Onylogy Font Checker is a Chrome extension created by **Ehasanul Haque** under
the **Onylogy Studio** banner. This document explains exactly what data the
extension handles.

**TL;DR — Nothing leaves your browser. Ever.**

---

## 1. What we collect

Onylogy Font Checker does **not** collect, transmit, or sell any personal
information, browsing history, page content, credentials, location data,
financial data, or any other category of user data.

There is **no account**, **no sign-in**, **no analytics**, and **no telemetry**.

## 2. What is stored locally

The extension uses `chrome.storage.local` — which lives entirely on your own
device and is never synced or transmitted — to remember the following
preferences:

| Stored item | Why |
|---|---|
| Theme preference (`light` or `dark`) | Your chosen theme persists across sessions. |
| Default unit (`px` / `rem` / `em`) | The popup remembers the unit you prefer. |
| Default export format | The Export tab opens to the format you used last. |
| Recently inspected font family names (max 30) | The Inspect tab can show the fonts you've seen recently. |
| Last inspected element snapshot | The popup shows the last element you hovered when you reopen it. |
| Last hierarchy and accessibility reports | Opening the Hierarchy or A11y tabs shows previous results without re-scanning. |

You can clear all of this at any time by removing the extension from
`chrome://extensions` or by clearing your browser data for extensions.

## 3. What we transmit

**Nothing.** The extension makes no network requests of its own. It does not
contact any analytics service, telemetry endpoint, or third-party server.

The only external network activity that may occur is when the popup and
on-page overlay load **Google Fonts** (Bricolage Grotesque, Montserrat,
JetBrains Mono) so the UI renders in the intended typefaces. This request is
made by the browser's own font loader, not by extension code, and the
request goes only to Google's font CDN (`fonts.googleapis.com` /
`fonts.gstatic.com`). No identifying information is attached.

## 4. Permissions explained

The extension requests the absolute minimum permissions Chrome allows.

- **`activeTab`** — Lets the extension read the computed styles of text on
  the page you have focused, **only when you invoke the extension** (by
  clicking the toolbar icon or pressing the keyboard shortcut). It does
  not grant background access to any tab.
- **`scripting`** — Lets the extension inject its content script into a tab
  that was already open before the extension was installed. Without this,
  pre-existing tabs would silently not work until the user reloaded them.
- **`storage`** — Lets the extension persist the preferences listed in
  Section 2 to `chrome.storage.local`.

**No host permissions** are requested. **No background tab access.** Clipboard
access is **write-only** — when you click a copy button, the extension writes
to the clipboard only and never reads from it.

## 5. Data sharing

We share **nothing**, with **no one**, ever. There is no third-party SDK in
the code, no remote analytics, no advertising network. The extension cannot
share data because it does not collect or transmit data.

## 6. Open source

The full source code is published on GitHub. You are encouraged to read it.

<https://github.com/ehasan28>

The networking story is short — there is no `fetch`, no `XMLHttpRequest`, no
`WebSocket`, and no `sendBeacon` anywhere in the codebase.

## 7. Children's privacy

This extension is not directed at children under 13. We do not knowingly
process any personal data from anyone, including children.

## 8. International users

The extension stores its preferences locally on your device regardless of
where you are in the world. Because no data leaves your device, this policy
applies uniformly to users in every jurisdiction (including the EU under
GDPR and California under the CCPA).

## 9. Changes to this policy

If this policy materially changes, a new version will be published in this
file and the **Last updated** date at the top will be revised. The Chrome
Web Store listing always points to the latest version.

## 10. Contact

Questions about this policy:

- **Email:** ehasan.artificial@gmail.com
- **GitHub Issues:** <https://github.com/ehasan28>

---

© 2026 **Ehasanul Haque** — Onylogy Studio. Released under the [MIT License](LICENSE).
