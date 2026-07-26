'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type Theme = 'light' | 'dark';
export type ThemePreference = Theme | 'system';

const ThemeCtx = createContext<{
  theme: ThemePreference;
  resolved: Theme;
  setTheme: (t: ThemePreference) => void;
  toggle: () => void;
} | null>(null);

function resolveTheme(theme: ThemePreference): Theme {
  if (theme === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  }
  return theme;
}

function applyDom(resolved: Theme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

export function ThemeProvider({
  children,
  initialTheme = 'dark',
}: {
  children: ReactNode;
  initialTheme?: ThemePreference;
}) {
  const [theme, setThemeState] = useState<ThemePreference>(initialTheme);
  const [resolved, setResolved] = useState<Theme>(() => resolveTheme(initialTheme));

  const apply = useCallback((t: ThemePreference) => {
    const r = resolveTheme(t);
    setResolved(r);
    applyDom(r);
    try {
      localStorage.setItem('athena_theme', t);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let initial: ThemePreference = initialTheme;
    try {
      const saved = localStorage.getItem('athena_theme');
      if (saved === 'light' || saved === 'dark' || saved === 'system') initial = saved;
    } catch {
      /* ignore */
    }
    setThemeState(initial);
    apply(initial);
  }, [apply, initialTheme]);

  const setTheme = useCallback(
    (t: ThemePreference) => {
      setThemeState(t);
      apply(t);
    },
    [apply],
  );

  const toggle = useCallback(() => {
    setTheme(resolved === 'dark' ? 'light' : 'dark');
  }, [setTheme, resolved]);

  const value = useMemo(
    () => ({ theme, resolved, setTheme, toggle }),
    [theme, resolved, setTheme, toggle],
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useTheme requires ThemeProvider');
  return ctx;
}
