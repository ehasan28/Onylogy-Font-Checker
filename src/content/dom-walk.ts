import { parseColor } from '../shared/typography/convert';
import type { RgbaColor } from '../shared/types';

export interface VisitOptions {
  minArea?: number;
  visibleOnly?: boolean;
  signal?: AbortSignal;
}

export async function walkVisibleElements(
  root: Document | ShadowRoot,
  onElement: (el: Element) => void,
  options: VisitOptions = {},
): Promise<number> {
  const minArea = options.minArea ?? 64;
  const visibleOnly = options.visibleOnly ?? true;
  let count = 0;

  const stack: Array<Element | ShadowRoot | Document> = [root];
  while (stack.length) {
    if (options.signal?.aborted) break;
    const node = stack.pop()!;
    const children =
      node instanceof Document || node instanceof ShadowRoot
        ? Array.from(node.children)
        : Array.from(node.children);
    for (const child of children) {
      if (!(child instanceof Element)) continue;
      if (isExtensionRoot(child)) continue;
      if (visibleOnly && !elementVisible(child, minArea)) continue;
      onElement(child);
      count++;
      if (child.shadowRoot) stack.push(child.shadowRoot);
      stack.push(child);
    }
  }
  return count;
}

export function isExtensionRoot(el: Element): boolean {
  const id = el.id ?? '';
  if (id.startsWith('onylogy-')) return true;
  return !!el.closest('[id^="onylogy-"]');
}

export function elementVisible(el: Element, minArea = 64): boolean {
  const style = getComputedStyleSafe(el);
  if (!style) return false;
  if (style.display === 'none') return false;
  if (style.visibility === 'hidden') return false;
  if (parseFloat(style.opacity || '1') === 0) return false;
  const rect = (el as HTMLElement).getBoundingClientRect?.();
  if (!rect) return false;
  if (rect.width * rect.height < minArea) return false;
  return true;
}

export function getComputedStyleSafe(el: Element): CSSStyleDeclaration | null {
  try {
    return window.getComputedStyle(el);
  } catch {
    return null;
  }
}

export function readBackground(el: Element): RgbaColor | null {
  const style = getComputedStyleSafe(el);
  if (!style) return null;
  return parseColor(style.backgroundColor);
}

export function readText(el: Element): RgbaColor | null {
  const style = getComputedStyleSafe(el);
  if (!style) return null;
  return parseColor(style.color);
}

export function isInteractive(el: Element): boolean {
  const tag = el.tagName;
  if (tag === 'A' || tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA')
    return true;
  const role = el.getAttribute('role');
  if (role && ['button', 'link', 'tab', 'menuitem'].includes(role)) return true;
  return false;
}

export function hasText(el: Element): boolean {
  const text = el.textContent?.trim() ?? '';
  if (!text) return false;
  // count only direct text nodes
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) return true;
  }
  return false;
}

export function ancestorsWithStyles(el: Element): Element[] {
  const out: Element[] = [];
  let cur: Element | null = el;
  while (cur && cur !== document.documentElement) {
    out.push(cur);
    cur = cur.parentElement;
  }
  if (document.documentElement) out.push(document.documentElement);
  return out;
}

export function elementSelector(el: Element): string {
  if (el.id) return `#${cssEscape(el.id)}`;
  const tag = el.tagName.toLowerCase();
  const cls = (el.getAttribute('class') ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((c) => `.${cssEscape(c)}`)
    .join('');
  return `${tag}${cls}`;
}

function cssEscape(s: string): string {
  if (typeof CSS !== 'undefined' && CSS.escape) return CSS.escape(s);
  return s.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}

export function* idleChunks<T>(items: T[], size: number): Iterable<T[]> {
  for (let i = 0; i < items.length; i += size) yield items.slice(i, i + size);
}

export function nextIdle(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof (globalThis as any).requestIdleCallback === 'function') {
      (globalThis as any).requestIdleCallback(() => resolve(), { timeout: 200 });
    } else {
      setTimeout(resolve, 0);
    }
  });
}
