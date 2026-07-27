'use client';

import { ChevronDown } from 'lucide-react';
import type { NavGroup } from '@/config/navigation';
import { isNavActive } from '@/config/navigation';
import { SidebarItem } from './SidebarItem';

export function SidebarGroup({
  group,
  pathname,
  collapsed,
  open,
  onToggle,
  onNavigate,
  showActive = true,
}: {
  group: NavGroup;
  pathname: string;
  collapsed: boolean;
  open: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  showActive?: boolean;
}) {
  const Icon = group.icon;
  const groupActive =
    showActive &&
    ((group.href ? isNavActive(pathname, group.href) : false) ||
      group.items.some((i) => isNavActive(pathname, i.href)));

  if (group.href && group.items.length === 0) {
    return (
      <SidebarItem
        href={group.href}
        label={group.label}
        icon={Icon}
              active={showActive && isNavActive(pathname, group.href)}
        collapsed={collapsed}
        onNavigate={onNavigate}
      />
    );
  }

  if (collapsed) {
    const target = group.href || group.items[0]?.href;
    if (!target) return null;
    return (
      <SidebarItem
        href={target}
        label={group.label}
        icon={Icon}
        active={showActive && groupActive}
        collapsed
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div className="athena-sidebar-group">
      <button
        type="button"
        className={`athena-sidebar-group-btn ${groupActive ? 'is-active' : ''}`}
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Icon size={18} aria-hidden className="shrink-0" />
          <span className="truncate">{group.label}</span>
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="athena-sidebar-group-items">
          {group.items.map((item) => (
            <SidebarItem
              key={`${item.href}-${item.label}`}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={showActive && isNavActive(pathname, item.href)}
              collapsed={false}
              nested
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
