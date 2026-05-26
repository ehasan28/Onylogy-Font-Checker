// Standalone Shadow DOM toast renderer for the content script.
// Mounted lazily on first call; reuses the same host for subsequent calls.
// Positioned bottom-left of the viewport, pointer-events none, scoped CSS.

const HOST_ID = 'onylogy-toast-root';
const DURATION_MS = 1800;

const CSS = `
:host { all: initial; }
* { box-sizing: border-box; }
.host {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 2147483647;
  pointer-events: none;
  font-family: Montserrat, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.toast {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #0d1424;
  color: #ffffff;
  padding: 10px 16px 10px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  box-shadow:
    0 12px 32px -8px rgba(0, 75, 209, 0.18),
    0 2px 6px rgba(15, 23, 42, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.08);
  opacity: 0;
  transform: translate(-8px, 0);
  transition: opacity 0.2s ease-out, transform 0.2s ease-out;
  max-width: 360px;
  overflow: hidden;
}
.toast.visible {
  opacity: 1;
  transform: translate(0, 0);
}
.toast.success {
  border-left: 3px solid #004bd1;
  padding-left: 14px;
}
.toast.error {
  background: #2a0e10;
  border-color: rgba(255, 107, 107, 0.25);
  border-left: 3px solid #ff6b6b;
  padding-left: 14px;
}
.swatch {
  width: 16px;
  height: 16px;
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  flex-shrink: 0;
}
.label {
  color: rgba(255, 255, 255, 0.78);
}
.value {
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 600;
  letter-spacing: 0.01em;
}
`.trim();

let host: HTMLElement | null = null;
let toastEl: HTMLDivElement | null = null;
let hideTimer: number | null = null;

function ensureHost(): void {
  if (host && document.documentElement.contains(host)) return;

  host = document.createElement('div');
  host.id = HOST_ID;
  host.style.cssText =
    'all:initial; position:fixed; inset:0; pointer-events:none; z-index:2147483647;';
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(CSS);
  shadow.adoptedStyleSheets = [sheet];

  const wrap = document.createElement('div');
  wrap.className = 'host';
  shadow.appendChild(wrap);

  toastEl = document.createElement('div');
  toastEl.className = 'toast';
  toastEl.setAttribute('role', 'status');
  toastEl.setAttribute('aria-live', 'polite');
  wrap.appendChild(toastEl);
}

export interface ToastOptions {
  tone?: 'success' | 'error';
  swatchHex?: string;
  /**
   * Optional emphasis word — rendered in mono after the message.
   * Example: showPageToast('Copied', { value: '#004bd0' }) → "Copied #004bd0"
   */
  value?: string;
}

export function showPageToast(message: string, options: ToastOptions = {}): void {
  ensureHost();
  if (!toastEl) return;

  const tone = options.tone ?? 'success';
  toastEl.className = `toast ${tone}`;

  while (toastEl.firstChild) toastEl.removeChild(toastEl.firstChild);

  if (options.swatchHex) {
    const sw = document.createElement('span');
    sw.className = 'swatch';
    sw.style.background = options.swatchHex;
    toastEl.appendChild(sw);
  }

  const text = document.createElement('span');
  text.className = 'label';
  text.textContent = message;
  toastEl.appendChild(text);

  if (options.value) {
    const v = document.createElement('span');
    v.className = 'value';
    v.textContent = options.value;
    toastEl.appendChild(v);
  }

  if (hideTimer !== null) window.clearTimeout(hideTimer);

  requestAnimationFrame(() => {
    toastEl?.classList.add('visible');
  });

  hideTimer = window.setTimeout(() => {
    toastEl?.classList.remove('visible');
  }, DURATION_MS);
}
