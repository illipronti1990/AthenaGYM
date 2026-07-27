'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { CalendarDays, Home, Settings, UserRound, Wallet } from 'lucide-react';

export type BottomNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: (pathname: string) => boolean;
};

const DEFAULT_ITEMS: BottomNavItem[] = [
  { href: '/app', label: 'Início', icon: Home, match: (p) => p === '/app' },
  {
    href: '/app/alunos',
    label: 'Alunos',
    icon: UserRound,
    match: (p) => p.startsWith('/app/alunos'),
  },
  {
    href: '/app/finance',
    label: 'Financeiro',
    icon: Wallet,
    match: (p) => p.startsWith('/app/finance'),
  },
  {
    href: '/app/operations/agenda',
    label: 'Agenda',
    icon: CalendarDays,
    match: (p) => p.startsWith('/app/operations'),
  },
  {
    href: '/app/settings',
    label: 'Ajustes',
    icon: Settings,
    match: (p) => p.startsWith('/app/settings') || p.startsWith('/app/profile'),
  },
];

export function BottomNavigation({ items = DEFAULT_ITEMS }: { items?: BottomNavItem[] }) {
  const pathname = usePathname() || '/app';

  return (
    <nav className="athena-bottom-nav" aria-label="Navegação principal mobile" data-testid="bottom-nav">
      {items.map((item) => {
        const active = item.match ? item.match(pathname) : pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`athena-bottom-nav-item ${active ? 'is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={20} aria-hidden />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
