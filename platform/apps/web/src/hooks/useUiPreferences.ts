'use client';

import { useCallback, useEffect, useState } from 'react';

const KEY = 'athena_ui_prefs';

export type UiPreferences = {
  language: 'pt-BR' | 'en';
  denseLayout: boolean;
  widgetsCompact: boolean;
};

const defaults: UiPreferences = {
  language: 'pt-BR',
  denseLayout: false,
  widgetsCompact: false,
};

export function useUiPreferences() {
  const [prefs, setPrefsState] = useState<UiPreferences>(defaults);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<UiPreferences>;
      setPrefsState({ ...defaults, ...parsed });
    } catch {
      /* ignore */
    }
  }, []);

  const setPrefs = useCallback((next: Partial<UiPreferences>) => {
    setPrefsState((prev) => {
      const merged = { ...prev, ...next };
      try {
        localStorage.setItem(KEY, JSON.stringify(merged));
      } catch {
        /* ignore */
      }
      return merged;
    });
  }, []);

  return { prefs, setPrefs };
}
