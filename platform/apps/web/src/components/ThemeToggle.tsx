'use client';

import { useTheme } from '@/components/ThemeProvider';

export function ThemeToggle() {
  const { theme, setTheme, resolved } = useTheme();
  const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="athena-btn athena-btn-ghost"
      aria-label="Alternar tema"
      title={`Tema: ${theme} (${resolved})`}
    >
      {resolved === 'dark' ? 'Claro' : 'Escuro'}
    </button>
  );
}
