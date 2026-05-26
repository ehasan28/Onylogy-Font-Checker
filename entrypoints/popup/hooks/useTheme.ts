import { useCallback, useEffect, useState } from 'react';
import { getPrefs, setPrefs } from '../../../src/shared/storage';
import type { ThemeName } from '../../../src/shared/types';

/**
 * Theme controller for the popup.
 *
 * Light is the default per spec — we do NOT consult prefers-color-scheme so
 * the behaviour is predictable. The user's last choice is persisted in
 * chrome.storage.local under `onylogy-type.prefs.theme`.
 *
 * The current theme is mirrored to `<html data-theme="...">` so all CSS-var
 * scopes pick it up, and Tailwind's dark variants resolve via the
 * `[data-theme="dark"]` selector configured in tailwind.config.ts.
 */
export function useTheme(): {
  theme: ThemeName;
  setTheme: (next: ThemeName) => void;
  toggle: () => void;
} {
  const [theme, setThemeState] = useState<ThemeName>('light');

  // Apply theme to the document root.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Hydrate from storage on mount.
  useEffect(() => {
    getPrefs().then((p) => {
      if (p.theme === 'light' || p.theme === 'dark') {
        setThemeState(p.theme);
      }
    });
  }, []);

  const setTheme = useCallback((next: ThemeName) => {
    setThemeState(next);
    setPrefs({ theme: next });
  }, []);

  const toggle = useCallback(() => {
    setThemeState((t) => {
      const next = t === 'light' ? 'dark' : 'light';
      setPrefs({ theme: next });
      return next;
    });
  }, []);

  return { theme, setTheme, toggle };
}
