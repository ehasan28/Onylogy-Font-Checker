import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Type,
  Layers,
  Eye,
  Download,
  MousePointerClick,
  Sun,
  Moon,
  Trash2,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/Tabs';
import { TooltipProvider } from './components/ui/Tooltip';
import { Button } from './components/ui/Button';
import { Kbd } from './components/ui/Kbd';
import { UnsupportedNotice } from './components/UnsupportedNotice';
import { DashboardTab } from './tabs/DashboardTab';
import { HierarchyTab } from './tabs/HierarchyTab';
import { AccessibilityTab } from './tabs/AccessibilityTab';
import { ExportTab } from './tabs/ExportTab';
import { isInjectablePage, sendToActiveTab } from '../../src/shared/messaging';
import { useInspectMode } from './hooks/useInspectPort';
import { useTheme } from './hooks/useTheme';
import {
  getPrefs,
  setPrefs as savePrefs,
  getLastHover,
  setLastHover,
  pushRecentFont,
  getRecentFonts,
} from '../../src/shared/storage';
import type { ElementTypography, SizeUnit } from '../../src/shared/types';

type TabId = 'dashboard' | 'hierarchy' | 'a11y' | 'export';

const GITHUB_URL = 'https://github.com/ehasan28';

interface TabSpec {
  id: TabId;
  label: string;
  Icon: typeof Type;
}

const TABS: TabSpec[] = [
  { id: 'dashboard', label: 'Inspect', Icon: Type },
  { id: 'hierarchy', label: 'Hierarchy', Icon: Layers },
  { id: 'a11y', label: 'A11y', Icon: Eye },
  { id: 'export', label: 'Export', Icon: Download },
];

export function App() {
  const [tab, setTab] = useState<TabId>('dashboard');
  const [supported, setSupported] = useState<boolean>(true);
  const [unit, setUnit] = useState<SizeUnit>('rem');
  const [hoverData, setHoverData] = useState<ElementTypography | null>(null);
  const [recentFonts, setRecentFonts] = useState<string[]>([]);

  const { theme, toggle: toggleTheme } = useTheme();
  const {
    active: inspectActive,
    data: liveData,
    pinCount,
    error: inspectError,
    toggle: toggleInspect,
    stop: stopInspect,
    clearPins,
  } = useInspectMode({ autoStart: true });

  // Hydrate from storage on mount.
  useEffect(() => {
    chrome.tabs
      .query({ active: true, currentWindow: true })
      .then(([t]) => setSupported(isInjectablePage(t?.url)));
    getPrefs().then((p) => setUnit(p.defaultUnit));
    getLastHover().then((h) => h && setHoverData(h));
    getRecentFonts().then(setRecentFonts);
  }, []);

  useEffect(() => {
    if (liveData) {
      setHoverData(liveData);
      setLastHover(liveData);
      if (liveData.family.primary) {
        pushRecentFont(liveData.family.primary).then(setRecentFonts);
      }
    }
  }, [liveData]);

  const handleUnit = useCallback((next: SizeUnit) => {
    setUnit(next);
    savePrefs({ defaultUnit: next });
  }, []);

  // Keyboard shortcuts: 1-4 tabs, `i` inspect, `e` export, `t` toggle theme.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      )
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case '1':
          setTab('dashboard');
          break;
        case '2':
          setTab('hierarchy');
          break;
        case '3':
          setTab('a11y');
          break;
        case '4':
          setTab('export');
          break;
        case 'i':
        case 'I':
          toggleInspect();
          break;
        case 'e':
        case 'E':
          setTab('export');
          break;
        case 't':
        case 'T':
          toggleTheme();
          break;
        case 'Escape':
        case 'Esc':
          // Stop inspect from inside the popup too. Chrome may close the
          // popup as a side effect — the stop message is dispatched first.
          if (inspectActive) {
            e.preventDefault();
            stopInspect();
          }
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleInspect, toggleTheme, stopInspect, inspectActive]);

  if (!supported) {
    return (
      <TooltipProvider delayDuration={400}>
        <div className="flex h-full min-h-[600px] w-[420px] flex-col bg-bg">
          <Header
            onToggleInspect={toggleInspect}
            inspectActive={inspectActive}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
          <main className="flex-1">
            <UnsupportedNotice />
          </main>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex h-full min-h-[600px] w-[420px] flex-col bg-bg">
        <Header
          onToggleInspect={toggleInspect}
          inspectActive={inspectActive}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Status bar — surfaces inspect state + pin count + clear action */}
        {(inspectActive || pinCount > 0 || inspectError) && (
          <StatusBar
            inspectActive={inspectActive}
            pinCount={pinCount}
            error={inspectError}
            onClearPins={clearPins}
          />
        )}

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as TabId)}
          className="flex flex-1 flex-col"
        >
          <TabsList>
            {TABS.map(({ id, label, Icon }) => (
              <TabsTrigger key={id} value={id}>
                <Icon size={13} strokeWidth={2.2} />
                <span>{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait" initial={false}>
              {TABS.map(
                ({ id }) =>
                  tab === id && (
                    <TabsContent key={id} value={id} forceMount>
                      {id === 'dashboard' && (
                        <DashboardTab
                          data={hoverData}
                          unit={unit}
                          onUnitChange={handleUnit}
                          recentFonts={recentFonts}
                          inspectArmed={inspectActive}
                          onToggleInspect={toggleInspect}
                        />
                      )}
                      {id === 'hierarchy' && <HierarchyTab unit={unit} />}
                      {id === 'a11y' && <AccessibilityTab />}
                      {id === 'export' && <ExportTab />}
                    </TabsContent>
                  ),
              )}
            </AnimatePresence>
          </div>

          <Footer />
        </Tabs>
      </div>
    </TooltipProvider>
  );
}

function Header({
  onToggleInspect,
  inspectActive,
  theme,
  onToggleTheme,
}: {
  onToggleInspect: () => void;
  inspectActive: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}) {
  return (
    <header className="flex items-center gap-3 border-b border-line bg-bg px-4 py-3">
      <div
        aria-hidden="true"
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent"
      >
        <span className="font-display text-base font-semibold leading-none text-accent-contrast">
          Aa
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <h1 className="font-display text-base font-semibold leading-tight text-fg">
          Onylogy Font Checker
        </h1>
        <p className="text-[11px] leading-tight text-fg-muted">
          by{' '}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="font-medium text-accent underline-offset-2 hover:underline"
          >
            Ehasanul Haque
          </a>{' '}
          · v0.2.0
        </p>
      </div>

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onToggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        title="Toggle theme (T)"
      >
        <AnimatePresence mode="wait" initial={false}>
          {theme === 'light' ? (
            <motion.span
              key="moon"
              initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.7 }}
              transition={{ type: 'spring', stiffness: 400, damping: 26 }}
            >
              <Moon size={14} strokeWidth={2.2} />
            </motion.span>
          ) : (
            <motion.span
              key="sun"
              initial={{ rotate: 90, opacity: 0, scale: 0.7 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -90, opacity: 0, scale: 0.7 }}
              transition={{ type: 'spring', stiffness: 400, damping: 26 }}
            >
              <Sun size={14} strokeWidth={2.2} />
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      {/* Inspect toggle */}
      <Button
        variant={inspectActive ? 'primary' : 'secondary'}
        size="sm"
        onClick={onToggleInspect}
        aria-label="Toggle inspect mode"
        title="Toggle inspect mode (I)"
      >
        <MousePointerClick size={13} strokeWidth={2.2} />
        <span>{inspectActive ? 'Inspecting' : 'Inspect'}</span>
      </Button>
    </header>
  );
}

function StatusBar({
  inspectActive,
  pinCount,
  error,
  onClearPins,
}: {
  inspectActive: boolean;
  pinCount: number;
  error: string | null;
  onClearPins: () => void;
}) {
  if (error) {
    return (
      <div
        role="alert"
        className="border-b border-bad/30 bg-bad/10 px-4 py-2 text-[11px] text-bad"
      >
        Couldn't connect: {error}
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-2 border-b border-line bg-bg-elev px-4 py-1.5 text-[11px]">
      <div className="flex items-center gap-2 text-fg-muted">
        {inspectActive && (
          <span className="inline-flex items-center gap-1.5">
            <span className="relative inline-block h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-accent" />
              <span className="absolute inset-0 animate-ping rounded-full bg-accent/60" />
            </span>
            <span>Inspecting · hover or click to pin</span>
          </span>
        )}
        {!inspectActive && pinCount > 0 && (
          <span>
            {pinCount} pinned card{pinCount === 1 ? '' : 's'} on the page
          </span>
        )}
      </div>
      {pinCount > 0 && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClearPins}
          aria-label="Clear all pinned cards"
          title={`Clear ${pinCount} pinned card${pinCount === 1 ? '' : 's'}`}
        >
          <Trash2 size={12} strokeWidth={2.2} />
        </Button>
      )}
    </div>
  );
}

function Footer() {
  return (
    <footer className="flex items-center justify-between gap-2 border-t border-line bg-bg px-4 py-2">
      <div className="flex items-center gap-2 text-[10px] text-fg-muted">
        <Kbd>1</Kbd>
        <Kbd>2</Kbd>
        <Kbd>3</Kbd>
        <Kbd>4</Kbd>
        <span>tabs</span>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-fg-muted">
        <Kbd>I</Kbd>
        <span>inspect</span>
        <span className="mx-1 text-fg-dim/40">·</span>
        <Kbd>T</Kbd>
        <span>theme</span>
      </div>
    </footer>
  );
}

/* Re-export for use by future tabs that fire toasts. */
export function pageToast(payload: {
  message: string;
  tone?: 'success' | 'error';
  value?: string;
}) {
  sendToActiveTab({ type: 'SHOW_TOAST', payload }).catch(() => undefined);
}
