'use client';

import { createContext, useContext, useEffect, type ReactNode } from 'react';

type A11yCtx = {
  announce: (message: string, politeness?: 'polite' | 'assertive') => void;
};

const Ctx = createContext<A11yCtx | null>(null);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.dataset.athenaA11y = 'wcag-2.2';
  }, []);

  function announce(message: string, politeness: 'polite' | 'assertive' = 'polite') {
    const id = politeness === 'assertive' ? 'athena-live-assertive' : 'athena-live-polite';
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = '';
    window.setTimeout(() => {
      el.textContent = message;
    }, 20);
  }

  return (
    <Ctx.Provider value={{ announce }}>
      <a href="#athena-main-content" className="athena-skip-link">
        Ir para o conteúdo principal
      </a>
      <div id="athena-live-polite" className="sr-only" aria-live="polite" aria-atomic="true" />
      <div
        id="athena-live-assertive"
        className="sr-only"
        aria-live="assertive"
        aria-atomic="true"
      />
      {children}
    </Ctx.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAccessibility requires AccessibilityProvider');
  return ctx;
}
