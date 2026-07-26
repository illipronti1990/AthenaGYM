'use client';

import { Moon, Sun } from 'lucide-react';
import { Tooltip } from '@athena/ui';
import { useTheme } from '@/components/ThemeProvider';

export function ThemeToggle() {
  const { resolved, toggle } = useTheme();
  const isDark = resolved === 'dark';
  return (
    <Tooltip content={isDark ? 'Tema claro' : 'Tema escuro'}>
      <button
        type="button"
        className="athena-icon-btn"
        onClick={toggle}
        aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
        data-testid="theme-toggle"
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </Tooltip>
  );
}
