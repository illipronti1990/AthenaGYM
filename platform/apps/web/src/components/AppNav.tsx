import Link from 'next/link';
import { LogoutButton } from '@/modules/auth/LogoutButton';
import { NotificationBell } from '@/components/NotificationBell';
import { CommandPalette } from '@/components/CommandPalette';
import { requireAccessToken } from '@/lib/auth/token';

const links = [
  { href: '/app', label: 'Dashboard' },
  { href: '/app/students', label: 'Alunos' },
  { href: '/app/trainers', label: 'Professores' },
  { href: '/app/sales', label: 'Comercial' },
  { href: '/app/finance', label: 'Financeiro' },
  { href: '/app/operations', label: 'Operações' },
  { href: '/app/workouts', label: 'Treinos' },
  { href: '/app/engagement', label: 'Engajamento' },
  { href: '/app/analytics', label: 'BI' },
  { href: '/app/settings', label: 'Configurações' },
  { href: '/app/admin/health', label: 'Saúde' },
  { href: '/app/admin/logs', label: 'Logs' },
  { href: '/app/help', label: 'Ajuda' },
  { href: '/app/users', label: 'Usuários' },
  { href: '/app/roles', label: 'Cargos' },
  { href: '/app/profile', label: 'Meu perfil' },
];

export async function AppNav() {
  const accessToken = await requireAccessToken();

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/app" className="font-bold tracking-wide text-[#A3001B]">
            ATHENA
          </Link>
          <nav className="flex flex-wrap gap-3 text-sm">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-zinc-700 hover:text-[#A3001B] dark:text-zinc-300"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
            title="Ctrl+K"
            data-testid="open-search-hint"
          >
            Ctrl+K
          </button>
          <NotificationBell accessToken={accessToken} />
          <LogoutButton />
        </div>
      </div>
      <CommandPalette accessToken={accessToken} />
    </header>
  );
}
