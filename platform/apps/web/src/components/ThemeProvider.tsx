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

type Theme = 'light' | 'dark' | 'system';

const ThemeCtx = createContext<{
  theme: Theme;
  resolved: 'light' | 'dark';
  setTheme: (t: Theme) => void;
} | null>(null);

function resolve(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
  return theme;
}

export function ThemeProvider({
  children,
  initialTheme = 'system',
}: {
  children: ReactNode;
  initialTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [resolved, setResolved] = useState<'light' | 'dark'>(() => resolve(initialTheme));

  const apply = useCallback((t: Theme) => {
    const r = resolve(t);
    setResolved(r);
    document.documentElement.classList.toggle('dark', r === 'dark');
    try {
      localStorage.setItem('athena_theme', t);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let initial = initialTheme;
    try {
      const saved = localStorage.getItem('athena_theme') as Theme | null;
      if (saved === 'light' || saved === 'dark' || saved === 'system') initial = saved;
    } catch {
      /* ignore */
    }
    setThemeState(initial);
    apply(initial);
  }, [apply, initialTheme]);

  const setTheme = useCallback(
    (t: Theme) => {
      setThemeState(t);
      apply(t);
    },
    [apply],
  );

  const value = useMemo(() => ({ theme, resolved, setTheme }), [theme, resolved, setTheme]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useTheme requires ThemeProvider');
  return ctx;
}
