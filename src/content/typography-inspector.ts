import { isExtensionRoot, getComputedStyleSafe, elementSelector } from './dom-walk';
import {
  parseFontFamily,
  parseLineHeight,
  parseLetterSpacing,
} from '../shared/typography/parse';
import { parseColor, rgbaToHex, compose } from '../shared/typography/convert';
import type { ElementTypography, RgbaColor } from '../shared/types';

/**
 * Hover-driven typography inspector.
 *
 * Mirrors the color extension's inspector lifecycle: rAF-throttled mousemove
 * stream + capture-phase listeners + `document.elementsFromPoint` for
 * underlay-tolerant element pick.
 */

export type HoverCallback = (data: ElementTypography) => void;
export type ClickCallback = (
  data: ElementTypography,
  position: { x: number; y: number },
) => void;
export type EscapeCallback = () => void;

let active = false;
let rafId: number | null = null;
let lastTarget: Element | null = null;
let lastEvent: MouseEvent | null = null;
let onHover: HoverCallback | null = null;
let onClick: ClickCallback | null = null;
let onEscape: EscapeCallback | null = null;

export function startInspector(
  hoverCb: HoverCallback,
  clickCb?: ClickCallback,
  escapeCb?: EscapeCallback,
): void {
  if (active) return;
  active = true;
  onHover = hoverCb;
  onClick = clickCb ?? null;
  onEscape = escapeCb ?? null;
  document.addEventListener('mousemove', handleMove, {
    capture: true,
    passive: true,
  });
  document.addEventListener('mouseover', handleOver, {
    capture: true,
    passive: true,
  });
  document.addEventListener('click', handleClick, { capture: true });
  document.addEventListener('keydown', handleKey, { capture: true });
}

export function stopInspector(): void {
  active = false;
  onHover = null;
  onClick = null;
  onEscape = null;
  document.removeEventListener('mousemove', handleMove, true);
  document.removeEventListener('mouseover', handleOver, true);
  document.removeEventListener('click', handleClick, true);
  document.removeEventListener('keydown', handleKey, true);
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  lastTarget = null;
  lastEvent = null;
}

function handleKey(e: KeyboardEvent): void {
  if (!active) return;
  if (e.key === 'Escape' || e.key === 'Esc') {
    e.preventDefault();
    e.stopPropagation();
    onEscape?.();
  }
}

function handleClick(e: MouseEvent): void {
  if (!active) return;
  // Don't pin when the click originated inside one of our overlays
  // (e.g. clicking a copy or close button on a pinned card).
  const path = e.composedPath();
  for (const node of path) {
    if (node instanceof Element && isExtensionRoot(node)) return;
  }

  const target = pickElementUnderPointer(e);
  if (!target) return;
  // Only fire for text-bearing elements — clicking a layout container is
  // not meaningful typography data.
  if (!hasInlineText(target)) return;

  // Suppress the host page's own click handler so we don't navigate away
  // when pinning a link or trigger a button. This intentionally trades off
  // host interactivity for a stable inspect workflow — pressing the
  // toolbar "Inspect" button turns inspect mode off, restoring normal click.
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  const data = collectTypography(target);
  onClick?.(data, { x: e.clientX, y: e.clientY });
}

function handleMove(e: MouseEvent): void {
  if (!active) return;
  lastEvent = e;
  if (rafId === null) {
    rafId = requestAnimationFrame(flush);
  }
}

function handleOver(e: MouseEvent): void {
  if (!active) return;
  lastEvent = e;
  if (rafId === null) {
    rafId = requestAnimationFrame(flush);
  }
}

function flush(): void {
  rafId = null;
  const e = lastEvent;
  if (!e || !active) return;
  const target = pickElementUnderPointer(e);
  if (!target || target === lastTarget) return;
  // Only fire when the target has text — typography on empty wrappers isn't
  // meaningful, and constantly firing on layout containers feels noisy.
  if (!hasInlineText(target)) {
    lastTarget = target;
    return;
  }
  lastTarget = target;
  const data = collectTypography(target);
  if (onHover) onHover(data);
}

function pickElementUnderPointer(e: MouseEvent): Element | null {
  const els = document.elementsFromPoint(e.clientX, e.clientY);
  for (const el of els) {
    if (!(el instanceof Element)) continue;
    if (isExtensionRoot(el)) continue;
    return el;
  }
  return null;
}

function hasInlineText(el: Element): boolean {
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      return true;
    }
  }
  // Many leaf inline elements (<a>, <strong>) hold their text as descendants
  // of nested spans. Walk up to a max depth of 4 children.
  if (el.children.length === 0 && (el.textContent ?? '').trim().length > 0) {
    return true;
  }
  return false;
}

/**
 * Collect typography properties for a single element from its computed style.
 */
export function collectTypography(el: Element): ElementTypography {
  const style = getComputedStyleSafe(el);
  const rect = (el as HTMLElement).getBoundingClientRect?.() ?? new DOMRect();

  const fontSizeRaw = style?.fontSize ?? '';
  const fontSizePx = parseFloat(fontSizeRaw) || 0;

  const lh = parseLineHeight(style?.lineHeight, fontSizePx);
  const ls = parseLetterSpacing(style?.letterSpacing, fontSizePx);
  const family = parseFontFamily(style?.fontFamily ?? '');

  const weight = parseInt(style?.fontWeight ?? '400', 10) || 400;

  const color = style ? parseColor(style.color) : null;
  const bg = walkEffectiveBackground(el);

  const sampleText = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 80);

  return {
    selector: elementSelector(el),
    tag: el.tagName.toLowerCase(),
    rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    family,
    fontSizePx,
    fontSizeRaw,
    lineHeightPx: lh.px,
    lineHeightRatio: lh.ratio,
    letterSpacingPx: ls.px,
    letterSpacingEm: ls.em,
    fontWeight: weight,
    fontStyle: style?.fontStyle ?? 'normal',
    fontStretch: style?.fontStretch ?? 'normal',
    textTransform: style?.textTransform ?? 'none',
    textAlign: style?.textAlign ?? 'start',
    textDecoration: style?.textDecoration ?? 'none',
    fontVariationSettings:
      style?.fontVariationSettings && style.fontVariationSettings !== 'normal'
        ? style.fontVariationSettings
        : null,
    color: color ? rgbaToHex(color) : null,
    effectiveBg: bg ? rgbaToHex(bg) : null,
    sampleText,
  };
}

/**
 * Walk ancestors compositing translucent backgrounds until we hit something
 * opaque (or the document edge — fall back to white).
 */
function walkEffectiveBackground(el: Element): RgbaColor | null {
  let composed: RgbaColor | null = null;
  let cur: Element | null = el;
  let safety = 0;
  while (cur && safety < 30) {
    safety++;
    const style = getComputedStyleSafe(cur);
    const bg = style ? parseColor(style.backgroundColor) : null;
    if (bg && bg.a > 0) {
      composed = composed ? compose(composed, bg) : bg;
      if (composed.a >= 0.999) return composed;
    }
    cur = cur.parentElement;
  }
  // Fall back to opaque white if nothing in the chain was opaque.
  if (composed) return compose(composed, { r: 255, g: 255, b: 255, a: 1 });
  return { r: 255, g: 255, b: 255, a: 1 };
}
