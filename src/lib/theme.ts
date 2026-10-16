import { useCallback, useEffect, useState } from 'react';
import { useMediaQuery } from './useMediaQuery';

export type ThemeChoice = 'system' | 'light' | 'dark';
export type Accent = 'koraal' | 'geel';

function stored<T extends string>(key: string, allowed: T[], fallback: T): T {
  try {
    const v = localStorage.getItem(key) as T | null;
    return v && allowed.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

function persist(key: string, value: string | null) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* niet erg */
  }
}

/** Licht/donker volgt het systeem, tenzij je het zelf kiest. */
export function useTheme() {
  const [choice, setChoice] = useState<ThemeChoice>(() => stored('balkon.theme', ['light', 'dark'], 'system' as ThemeChoice));
  const [accent, setAccentState] = useState<Accent>(() => stored('balkon.accent', ['geel'], 'koraal' as Accent));
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)');
  const resolved: 'light' | 'dark' = choice === 'system' ? (systemDark ? 'dark' : 'light') : choice;

  useEffect(() => {
    const root = document.documentElement;
    if (choice === 'system') delete root.dataset.theme;
    else root.dataset.theme = choice;
    persist('balkon.theme', choice === 'system' ? null : choice);
  }, [choice]);

  useEffect(() => {
    const root = document.documentElement;
    if (accent === 'geel') root.dataset.accent = 'geel';
    else delete root.dataset.accent;
    persist('balkon.accent', accent === 'geel' ? 'geel' : null);
  }, [accent]);

  useEffect(() => {
    document.querySelectorAll('meta[name=theme-color]').forEach(m => m.setAttribute('content', resolved === 'dark' ? '#121712' : '#EDE7DA'));
  }, [resolved]);

  const toggle = useCallback(() => setChoice(resolved === 'dark' ? 'light' : 'dark'), [resolved]);

  return { choice, resolved, setChoice, toggle, accent, setAccent: setAccentState };
}

export type ThemeApi = ReturnType<typeof useTheme>;
