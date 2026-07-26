'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@athena/ui';
import { LogoutButton } from '@/modules/auth/LogoutButton';
import { NotificationBell } from '@/components/NotificationBell';
import { SocialLinks } from '@/components/SocialLinks';
import { CommandPalette } from '@/components/CommandPalette';

const primaryNav = [
  { href: '/app', label: 'Dashboard', icon: '🏠' },
  { href: '/app/students', label: 'Alunos', icon: '👤' },
  { href: '/app/trainers', label: 'Professores', icon: '🎓' },
  { href: '/app/sales', label: 'Comercial', icon: '💼' },
  { href: '/app/finance', label: 'Financeiro', icon: '💰' },
  { href: '/app/operations', label: 'Agenda', icon: '📅' },
  { href: '/app/workouts', label: 'Treinos', icon: '🏋' },
  { href: '/app/workouts/assessments', label: 'Avaliações', icon: '❤️' },
  { href: '/app/analytics', label: 'BI', icon: '📈' },
  { href: '/app/settings', label: 'Configurações', icon: '⚙' },
];

const secondaryNav = [
  { href: '/app/engagement', label: 'Engajamento' },
  { href: '/app/users', label: 'Usuários' },
  { href: '/app/roles', label: 'Cargos' },
  { href: '/app/admin/health', label: 'Saúde' },
  { href: '/app/admin/logs', label: 'Logs' },
  { href: '/app/help', label: 'Ajuda' },
];

export function AppShell({
  accessToken,
  children,
  userName,
}: {
  accessToken: string;
  children: React.ReactNode;
  userName?: string | null;
}) {
  const pathname = usePathname() || '/app';

  return (
    <div className="athena-shell flex min-h-screen">
      <aside className="athena-sidebar hidden shrink-0 md:flex md:flex-col">
        <Logo />
        <nav className="flex-1 overflow-y-auto pb-4">
          {primaryNav.map((item) => {
            const active =
              item.href === '/app'
                ? pathname === '/app'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`athena-sidebar-link ${active ? 'athena-sidebar-link-active' : ''}`}
              >
                <span aria-hidden>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="mx-4 my-3 border-t border-[var(--border)]" />
          {secondaryNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`athena-sidebar-link ${active ? 'athena-sidebar-link-active' : ''}`}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[var(--border)] p-3">
          <Link href="/app/profile" className="athena-sidebar-link">
            <span aria-hidden>👤</span>
            <span>{userName || 'Meu perfil'}</span>
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="athena-topbar flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3 md:hidden">
            <Link href="/app" className="font-bold tracking-[0.16em] text-[var(--gold)]">
              ATHENA
            </Link>
          </div>
          <p className="hidden text-sm text-[var(--muted)] md:block">
            Plataforma premium para academias
          </p>
          <div className="flex items-center gap-2">
            <SocialLinks accessToken={accessToken} />
            <span className="hidden rounded-[10px] border border-[var(--border)] px-2 py-1 text-xs text-[var(--gold)] sm:inline">
              Ctrl+K
            </span>
            <NotificationBell accessToken={accessToken} />
            <LogoutButton />
          </div>
        </header>

        <nav className="flex gap-2 overflow-x-auto border-b border-[var(--border)] bg-[var(--surface)] px-3 py-2 md:hidden">
          {primaryNav.map((item) => {
            const active =
              item.href === '/app'
                ? pathname === '/app'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-[10px] px-3 py-1.5 text-sm ${
                  active
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--gold)] hover:text-[var(--gold-light)]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 px-4 py-6 md:px-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      <CommandPalette accessToken={accessToken} />
    </div>
  );
}
