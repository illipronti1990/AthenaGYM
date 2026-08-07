'use client';

import Link from 'next/link';
import { athenaIcons } from '@movvo/ui';

export function SidebarFooter({
  userName,
  collapsed,
  onNavigate,
}: {
  userName?: string | null;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const ProfileIcon = athenaIcons.profile;
  return (
    <div className="border-t border-[var(--border)] p-2">
      <Link
        href="/app/profile"
        onClick={onNavigate}
        title={collapsed ? userName || 'Meu perfil' : undefined}
        className="movvo-sidebar-link"
      >
        <ProfileIcon size={18} aria-hidden className="shrink-0" />
        {!collapsed ? <span className="truncate">{userName || 'Meu perfil'}</span> : null}
      </Link>
    </div>
  );
}
