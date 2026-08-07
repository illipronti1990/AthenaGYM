'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Tooltip } from '@movvo/ui';

export function SidebarItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  nested = false,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
  nested?: boolean;
  onNavigate?: () => void;
}) {
  const link = (
    <Link
      href={href}
      onClick={onNavigate}
      className={`movvo-sidebar-link ${nested ? 'movvo-sidebar-link-nested' : ''} ${
        active ? 'movvo-sidebar-link-active' : ''
      }`}
      data-testid={`nav-${href.replace(/\//g, '-')}`}
      aria-label={label}
    >
      <Icon size={18} aria-hidden className="shrink-0" />
      {!collapsed ? <span className="truncate">{label}</span> : null}
    </Link>
  );

  if (collapsed) {
    return <Tooltip content={label}>{link}</Tooltip>;
  }

  return link;
}
