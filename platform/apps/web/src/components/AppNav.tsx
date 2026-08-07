import Link from 'next/link';
import { Logo } from '@athena/ui';
import { LogoutButton } from '@/modules/auth/LogoutButton';
import { NotificationBell } from '@/components/NotificationBell';
import { CommandPalette } from '@/components/CommandPalette';
import { requireAccessToken } from '@/lib/auth/token';

const links = [
  { href: '/app', label: 'Dashboard' },
  { href: '/app/alunos', label: 'Alunos' },
  { href: '/app/trainers', label: 'Professores' },
  { href: '/app/sales', label: 'Comercial' },
  { href: '/app/financeiro', label: 'Financeiro' },
  { href: '/app/acesso', label: 'Acesso' },
  { href: '/app/integracoes', label: 'Integrações' },
  { href: '/app/workouts', label: 'Treinos' },
  { href: '/app/engagement', label: 'Engajamento' },
  { href: '/app/analytics', label: 'Relatórios' },
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
    <header className="athena-topbar">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/app" className="shrink-0">
            <Logo variant="compact" className="!p-0" />
          </Link>
          <nav className="flex flex-wrap gap-3 text-sm">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="athena-link text-[var(--gold)]">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="athena-btn athena-btn-secondary athena-btn-sm"
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
