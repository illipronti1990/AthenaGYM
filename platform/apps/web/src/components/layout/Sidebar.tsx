'use client';

import { useEffect, useState } from 'react';
import { Logo } from '@athena/ui';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { findActiveGroup, navGroups } from '@/config/navigation';
import { useLayout } from './LayoutProvider';
import { SidebarGroup } from './SidebarGroup';
import { SidebarFooter } from './SidebarFooter';
import { useInitialPathname } from './PathnameSyncProvider';
import { useStablePathname } from './useStablePathname';

export function Sidebar({ userName }: { userName?: string | null }) {
  const initialPathname = useInitialPathname();
  const pathname = useStablePathname(initialPathname);
  const [hydrated, setHydrated] = useState(false);
  const routePath = hydrated ? pathname : initialPathname;
  const activeGroupId = findActiveGroup(routePath);
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useLayout();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const effectiveCollapsed = collapsed && !mobileOpen;

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    const active = findActiveGroup(pathname);
    if (active) {
      setOpenGroups((prev) => ({ ...prev, [active]: true }));
    }
  }, [pathname]);

  function isGroupOpen(groupId: string) {
    if (groupId in openGroups) return openGroups[groupId];
    if (!hydrated) return false;
    return groupId === activeGroupId;
  }

  function toggleGroup(id: string) {
    setOpenGroups((prev) => ({
      ...prev,
      [id]: !(id in prev ? prev[id] : id === activeGroupId),
    }));
  }

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="athena-sidebar-backdrop md:hidden"
          aria-label="Fechar menu"
          onClick={closeMobile}
        />
      ) : null}

      <aside
        className={`athena-sidebar athena-sidebar-px2 ${effectiveCollapsed ? 'is-collapsed' : ''} ${
          mobileOpen ? 'is-mobile-open' : ''
        }`}
        data-testid="app-sidebar"
      >
        <div className="flex items-center justify-between gap-2 px-2 pt-2">
          <div className={`min-w-0 flex-1 ${effectiveCollapsed ? 'flex justify-center' : ''}`}>
            <Logo variant={effectiveCollapsed ? 'compact' : 'horizontal'} className="!p-2" />
          </div>
          <button
            type="button"
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-[var(--border)] text-[var(--gold)] transition duration-150 hover:border-[var(--gold)] md:inline-flex"
            onClick={toggleCollapsed}
            title={collapsed ? 'Expandir menu (Ctrl+B)' : 'Recolher menu (Ctrl+B)'}
            aria-label={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
            data-testid="sidebar-collapse"
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {navGroups.map((group) => (
            <SidebarGroup
              key={group.id}
              group={group}
              pathname={routePath}
              collapsed={effectiveCollapsed}
              open={isGroupOpen(group.id)}
              showActive={hydrated}
              onToggle={() => toggleGroup(group.id)}
              onNavigate={closeMobile}
            />
          ))}
        </nav>

        <SidebarFooter userName={userName} collapsed={effectiveCollapsed} onNavigate={closeMobile} />
      </aside>
    </>
  );
}
