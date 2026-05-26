import { createRoot, type Root } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { motionValue } from 'framer-motion';
import { Overlay, type PinnedCard } from './Overlay';
import overlayCss from './overlay.css?raw';
import type { ElementTypography, ThemeName } from '../../shared/types';

export interface OverlayHandle {
  /** Update which element the floating tooltip is reporting on. */
  update(data: ElementTypography): void;
  /** Hide the floating tooltip without affecting pinned cards. */
  hideHover(): void;
  /**
   * Add a new pinned card. `position` is in VIEWPORT coords (clientX/Y);
   * we convert to document coords internally so the card scrolls with the
   * page.
   */
  pin(data: ElementTypography, position: { x: number; y: number }): void;
  setTheme(theme: ThemeName): void;
  unpin(id: string): void;
  clearPins(): void;
  pinCount(): number;
  destroy(): void;
}

const HOST_ID = 'onylogy-typography-overlay';

// Approximate card dimensions used by the placement function. The floating
// hover card is intentionally small (family-name only); pinned cards are
// the full data layout. Both honor the same placement rules.
const HOVER_W = 220;
const HOVER_H = 60;
const PIN_W = 320;
const PIN_H = 260;
const CURSOR_GAP = 16;
const EDGE_MARGIN = 8;

export function mountOverlay(): OverlayHandle {
  const existing = document.getElementById(HOST_ID);
  if (existing) existing.remove();

  const host = document.createElement('div');
  host.id = HOST_ID;
  host.style.cssText =
    'all:initial; position:fixed; inset:0; z-index:2147483647; pointer-events:none;';
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(overlayCss);
  shadow.adoptedStyleSheets = [sheet];

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href =
    'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600&family=Montserrat:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap';
  shadow.appendChild(link);

  const mount = document.createElement('div');
  shadow.appendChild(mount);

  const root: Root = createRoot(mount);

  /* ─────────────────────────  State  ─────────────────────────── */

  let latestData: ElementTypography | null = null;
  let pinnedCards: PinnedCard[] = [];
  let theme: ThemeName = 'light';
  let rerender: (() => void) | null = null;
  let pinCounter = 0;
  let pointerReady = false;
  let setPointerReady: ((v: boolean) => void) | null = null;

  // Cursor follow — viewport coords, updated every mousemove.
  const pointerX = motionValue(0);
  const pointerY = motionValue(0);

  // Scroll — used to reproject pinned cards from document → viewport.
  const scrollX = motionValue(window.scrollX);
  const scrollY = motionValue(window.scrollY);

  /* ─────────────────────────  Pointer tracking  ───────────────── */

  /**
   * Place a card near a pointer position, preferring below-right of the
   * cursor. Instead of flipping ABOVE when there's no room below (the old
   * behavior, which confused users at the bottom of the viewport), we
   * clamp into the viewport so the card stays consistently in the same
   * relative position to the cursor.
   *
   *   Horizontal: prefer right → flip to left only when right has no room
   *               → clamp as a last resort
   *   Vertical:   prefer below  → clamp to bottom edge if no room below
   *               (never flip above the cursor)
   */
  function placeAt(
    clientX: number,
    clientY: number,
    w: number,
    h: number,
  ): { x: number; y: number } {
    let x = clientX + CURSOR_GAP;
    let y = clientY + CURSOR_GAP;

    // Horizontal — prefer right of cursor; flip to left only if no room
    // for the whole card on the right.
    if (x + w + EDGE_MARGIN > window.innerWidth) {
      const flipped = clientX - w - CURSOR_GAP;
      if (flipped >= EDGE_MARGIN) {
        x = flipped;
      } else {
        x = Math.max(EDGE_MARGIN, window.innerWidth - w - EDGE_MARGIN);
      }
    }

    // Vertical — clamp to viewport bottom; do NOT flip above the cursor.
    // The card stays "below the cursor" semantically; it just nudges up
    // along the bottom edge when there's not enough room.
    if (y + h + EDGE_MARGIN > window.innerHeight) {
      y = Math.max(EDGE_MARGIN, window.innerHeight - h - EDGE_MARGIN);
    }

    if (x < EDGE_MARGIN) x = EDGE_MARGIN;
    if (y < EDGE_MARGIN) y = EDGE_MARGIN;

    return { x, y };
  }

  const onMove = (e: MouseEvent) => {
    const { x, y } = placeAt(e.clientX, e.clientY, HOVER_W, HOVER_H);
    pointerX.set(x);
    pointerY.set(y);
    if (!pointerReady) {
      pointerReady = true;
      setPointerReady?.(true);
    }
  };
  document.addEventListener('mousemove', onMove, { capture: true, passive: true });

  /* ─────────────────────────  Scroll tracking  ────────────────── */

  const onScroll = () => {
    scrollX.set(window.scrollX);
    scrollY.set(window.scrollY);
  };
  window.addEventListener('scroll', onScroll, { capture: true, passive: true });
  // Also handle window resize — affects how page coords relate to layout.
  window.addEventListener('resize', onScroll, { passive: true });

  /* ─────────────────────────  React tree  ────────────────────── */

  function App() {
    const [, tick] = useState(0);
    const [ready, setReady] = useState(pointerReady);
    useEffect(() => {
      rerender = () => tick((n) => n + 1);
      setPointerReady = setReady;
      return () => {
        rerender = null;
        setPointerReady = null;
      };
    }, []);

    return (
      <Overlay
        data={latestData}
        pointerX={pointerX}
        pointerY={pointerY}
        scrollX={scrollX}
        scrollY={scrollY}
        pointerReady={ready}
        pinned={pinnedCards}
        onUnpin={(id) => {
          pinnedCards = pinnedCards.filter((c) => c.id !== id);
          rerender?.();
        }}
        theme={theme}
      />
    );
  }

  root.render(<App />);

  /* ─────────────────────────  Public handle  ─────────────────── */

  return {
    update(data) {
      latestData = data;
      rerender?.();
    },
    hideHover() {
      latestData = null;
      rerender?.();
    },
    pin(data, position) {
      // Convert viewport coords to document coords so pinned cards stay
      // anchored to the page content as the user scrolls. Use the larger
      // pinned-card dimensions for accurate edge-aware placement.
      const { x, y } = placeAt(position.x, position.y, PIN_W, PIN_H);
      const documentX = x + window.scrollX;
      const documentY = y + window.scrollY;
      pinnedCards = [
        ...pinnedCards,
        {
          id: `pin-${++pinCounter}-${Date.now()}`,
          data,
          documentX,
          documentY,
        },
      ];
      rerender?.();
    },
    setTheme(next) {
      if (next === theme) return;
      theme = next;
      rerender?.();
    },
    unpin(id) {
      pinnedCards = pinnedCards.filter((c) => c.id !== id);
      rerender?.();
    },
    clearPins() {
      if (pinnedCards.length === 0) return;
      pinnedCards = [];
      rerender?.();
    },
    pinCount() {
      return pinnedCards.length;
    },
    destroy() {
      document.removeEventListener('mousemove', onMove, true);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
      try {
        root.unmount();
      } catch {
        /* noop */
      }
      host.remove();
    },
  };
}
