'use client';

import { Menu, Search } from 'lucide-react';
import { Tooltip } from '@athena/ui';
import { useLayout } from './LayoutProvider';
import { AppBreadcrumb } from './AppBreadcrumb';
import { NotificationPanel } from './NotificationPanel';
import { UserMenu } from './UserMenu';
import { ThemeToggle } from '@/components/ThemeToggle';

export function Topbar({
  accessToken,
  userName,
}: {
  accessToken: string;
  userName?: string | null;
}) {
  const { toggleMobile, openSearch, pageLoading } = useLayout();

  return (
    <header className="athena-topbar athena-topbar-px2" data-testid="app-topbar">
      {pageLoading ? <div className="athena-page-progress" aria-hidden /> : null}
      <div className="flex items-center gap-3">
        <Tooltip content="Abrir menu">
          <button
            type="button"
            className="athena-icon-btn md:hidden"
            onClick={toggleMobile}
            aria-label="Abrir menu"
            data-testid="mobile-menu"
          >
            <Menu size={18} />
          </button>
        </Tooltip>
        <AppBreadcrumb />
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:justify-center">
        <Tooltip content="Pesquisar (Ctrl+K)">
          <button
            type="button"
            className="athena-search-trigger"
            onClick={openSearch}
            data-testid="open-search"
          >
            <Search size={16} className="shrink-0 text-[var(--muted)]" />
            <span className="hidden truncate sm:inline">Pesquisar…</span>
            <kbd className="athena-kbd">Ctrl+K</kbd>
          </button>
        </Tooltip>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationPanel accessToken={accessToken} />
        <UserMenu userName={userName} />
      </div>
    </header>
  );
}
