'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { Tooltip } from '@athena/ui';
import { useTheme, type ThemePreference } from '@/components/ThemeProvider';

const CYCLE: ThemePreference[] = ['system', 'light', 'dark'];

export function ThemeToggle() {
  const { theme, resolved, setTheme } = useTheme();

  function cycle() {
    const idx = CYCLE.indexOf(theme);
    setTheme(CYCLE[(idx + 1) % CYCLE.length]);
  }

  const Icon = theme === 'system' ? Monitor : resolved === 'dark' ? Moon : Sun;
  const label =
    theme === 'system'
      ? 'Tema do sistema'
      : resolved === 'dark'
        ? 'Tema escuro'
        : 'Tema claro';

  return (
    <Tooltip content={`${label} (clique para alternar)`}>
      <button
        type="button"
        className="athena-icon-btn"
        onClick={cycle}
        aria-label={`${label}. Alternar tema claro, escuro ou sistema`}
        data-testid="theme-toggle"
      >
        <Icon size={18} />
      </button>
    </Tooltip>
  );
}
