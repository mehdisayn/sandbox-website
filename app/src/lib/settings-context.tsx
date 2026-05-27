// Settings context — theme mode + accent. Persists via PrefsRepo, applies
// .dark class to <html> and writes accent CSS variables on :root.
// DESIGN.md §2.3 lists the 5 accent presets.

import {
  createContext, useCallback, useContext, useEffect, useState,
  type ReactNode,
} from 'react';
import { prefsRepo } from './repo/active';
import { PREF_KEYS } from './prefs';

export type ThemeMode = 'system' | 'light' | 'dark';

export const ACCENT_PRESETS: Record<string, { soft: string; softDark: string; label: string }> = {
  '#e07a30': { soft: '#fce5d0', softDark: '#3a1f10', label: 'bucket' },
  '#e8c547': { soft: '#fdf6dc', softDark: '#3a3216', label: 'sun'    },
  '#bcd5ec': { soft: '#e5eff8', softDark: '#1f2e3a', label: 'sky'    },
  '#3a7f3a': { soft: '#dcecdc', softDark: '#16321a', label: 'ball'   },
  '#2c5da0': { soft: '#d8e3f1', softDark: '#0f1d3a', label: 'block'  },
};

const DEFAULT_ACCENT = '#e07a30';

type Ctx = {
  theme: ThemeMode;
  effectiveMode: 'light' | 'dark';
  accent: string;
  setTheme: (t: ThemeMode) => void;
  setAccent: (hex: string) => void;
};

const SettingsCtx = createContext<Ctx | null>(null);

export function useSettings() {
  const c = useContext(SettingsCtx);
  if (!c) throw new Error('useSettings outside SettingsProvider');
  return c;
}

function getSystemDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

function rgbTriplet(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return '232 197 71';
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 0xff} ${(n >> 8) & 0xff} ${n & 0xff}`;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [accent, setAccentState] = useState<string>(DEFAULT_ACCENT);
  const [systemDark, setSystemDark] = useState<boolean>(getSystemDark());

  // Hydrate once from Dexie.
  useEffect(() => {
    (async () => {
      const t = await prefsRepo.get<ThemeMode>(PREF_KEYS.theme);
      if (t === 'system' || t === 'light' || t === 'dark') setThemeState(t);
      const a = await prefsRepo.get<string>(PREF_KEYS.accent);
      if (a && /^#[0-9a-f]{6}$/i.test(a)) setAccentState(a);
    })();
  }, []);

  // Follow OS dark-mode changes while theme is 'system'.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const effectiveMode: 'light' | 'dark' =
    theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  // Apply .dark class to <html> so the CSS variables in index.css switch.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', effectiveMode === 'dark');
    document.querySelector('meta[name=theme-color]')?.setAttribute(
      'content',
      effectiveMode === 'dark' ? '#171717' : '#fbfaf6'
    );
  }, [effectiveMode]);

  // Apply accent CSS variables.
  useEffect(() => {
    const preset = ACCENT_PRESETS[accent] ?? ACCENT_PRESETS[DEFAULT_ACCENT];
    document.documentElement.style.setProperty('--accent', rgbTriplet(accent));
    document.documentElement.style.setProperty(
      '--accent-soft',
      rgbTriplet(effectiveMode === 'dark' ? preset.softDark : preset.soft)
    );
  }, [accent, effectiveMode]);

  const setTheme = useCallback((t: ThemeMode) => {
    setThemeState(t);
    prefsRepo.set(PREF_KEYS.theme, t).catch(() => {});
  }, []);

  const setAccent = useCallback((hex: string) => {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return;
    setAccentState(hex);
    prefsRepo.set(PREF_KEYS.accent, hex).catch(() => {});
  }, []);

  return (
    <SettingsCtx.Provider value={{ theme, effectiveMode, accent, setTheme, setAccent }}>
      {children}
    </SettingsCtx.Provider>
  );
}
