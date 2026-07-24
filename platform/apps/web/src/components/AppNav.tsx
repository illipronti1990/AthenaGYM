import Link from 'next/link';
import { LogoutButton } from '@/modules/auth/LogoutButton';

const links = [
  { href: '/app', label: 'Dashboard' },
  { href: '/app/students', label: 'Alunos' },
  { href: '/app/sales', label: 'Comercial' },
  { href: '/app/finance', label: 'Financeiro' },
  { href: '/app/operations', label: 'Operações' },
  { href: '/app/workouts', label: 'Treinos' },
  { href: '/app/engagement', label: 'Engajamento' },
  { href: '/app/analytics', label: 'BI' },
  { href: '/app/users', label: 'Usuários' },
  { href: '/app/roles', label: 'Cargos' },
  { href: '/app/profile', label: 'Meu perfil' },
];

export function AppNav() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/app" className="font-bold tracking-wide text-[#A3001B]">
            ATHENAS
          </Link>
          <nav className="flex gap-3 text-sm">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-zinc-700 hover:text-[#A3001B]">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}
