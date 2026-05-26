import type {
  A11yReport,
  ElementTypography,
  HierarchyReport,
  Prefs,
} from './types';

/**
 * Storage namespace is prefixed `onylogy-type.*` so the typography extension's
 * data never collides with the sibling color extension (which uses `onylogy.*`).
 */

const KEY_RECENT_FONTS = 'onylogy-type.recentFonts';
const KEY_LAST_HIERARCHY = 'onylogy-type.lastHierarchy';
const KEY_LAST_HOVER = 'onylogy-type.lastHover';
const KEY_LAST_A11Y = 'onylogy-type.lastA11y';
const KEY_PREFS = 'onylogy-type.prefs';

const MAX_RECENT = 30;

export const DEFAULT_PREFS: Prefs = {
  defaultUnit: 'rem',
  defaultExport: 'css-vars',
  theme: 'light',
  showSourceBadge: true,
  reducedMotion: 'auto',
};

/* ──────────────────────────  Recent fonts (LRU) ──────────────────────── */

export async function getRecentFonts(): Promise<string[]> {
  const v = await chrome.storage.local.get(KEY_RECENT_FONTS);
  const list = v[KEY_RECENT_FONTS];
  return Array.isArray(list) ? list.filter((s) => typeof s === 'string') : [];
}

export async function pushRecentFont(family: string): Promise<string[]> {
  const clean = family.trim();
  if (!clean) return getRecentFonts();
  const list = await getRecentFonts();
  const next = [clean, ...list.filter((f) => f.toLowerCase() !== clean.toLowerCase())].slice(
    0,
    MAX_RECENT,
  );
  await chrome.storage.local.set({ [KEY_RECENT_FONTS]: next });
  return next;
}

export async function clearRecentFonts(): Promise<void> {
  await chrome.storage.local.remove(KEY_RECENT_FONTS);
}

/* ────────────────────────  Last hierarchy report  ────────────────────── */

export async function setLastHierarchy(report: HierarchyReport): Promise<void> {
  await chrome.storage.local.set({ [KEY_LAST_HIERARCHY]: report });
}

export async function getLastHierarchy(): Promise<HierarchyReport | null> {
  const v = await chrome.storage.local.get(KEY_LAST_HIERARCHY);
  return (v[KEY_LAST_HIERARCHY] as HierarchyReport | undefined) ?? null;
}

/* ────────────────────────  Last hovered element  ─────────────────────── */

export async function setLastHover(data: ElementTypography): Promise<void> {
  await chrome.storage.local.set({ [KEY_LAST_HOVER]: data });
}

export async function getLastHover(): Promise<ElementTypography | null> {
  const v = await chrome.storage.local.get(KEY_LAST_HOVER);
  return (v[KEY_LAST_HOVER] as ElementTypography | undefined) ?? null;
}

/* ────────────────────────  Last accessibility ────────────────────────── */

export async function setLastA11y(report: A11yReport): Promise<void> {
  await chrome.storage.local.set({ [KEY_LAST_A11Y]: report });
}

export async function getLastA11y(): Promise<A11yReport | null> {
  const v = await chrome.storage.local.get(KEY_LAST_A11Y);
  return (v[KEY_LAST_A11Y] as A11yReport | undefined) ?? null;
}

/* ────────────────────────────  Preferences  ──────────────────────────── */

export async function getPrefs(): Promise<Prefs> {
  const v = await chrome.storage.local.get(KEY_PREFS);
  return { ...DEFAULT_PREFS, ...(v[KEY_PREFS] ?? {}) };
}

export async function setPrefs(patch: Partial<Prefs>): Promise<Prefs> {
  const cur = await getPrefs();
  const next = { ...cur, ...patch };
  await chrome.storage.local.set({ [KEY_PREFS]: next });
  return next;
}
