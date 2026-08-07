'use client';

import { useCallback, useEffect, useState } from 'react';

const KEY = 'movvo_ui_prefs';

export type UiPreferences = {
  language: 'pt-BR' | 'en';
  denseLayout: boolean;
  widgetsCompact: boolean;
  dateFormat: 'dd/MM/yyyy' | 'yyyy-MM-dd';
  tourCompletedV1: boolean;
};

const defaults: UiPreferences = {
  language: 'pt-BR',
  denseLayout: false,
  widgetsCompact: false,
  dateFormat: 'dd/MM/yyyy',
  tourCompletedV1: false,
};

export function useUiPreferences() {
  const [prefs, setPrefsState] = useState<UiPreferences>(defaults);

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(KEY) || localStorage.getItem('athena_ui_prefs');
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<UiPreferences>;
      setPrefsState({ ...defaults, ...parsed });
      if (!localStorage.getItem(KEY)) {
        localStorage.setItem(KEY, raw);
        localStorage.removeItem('athena_ui_prefs');
      }
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
