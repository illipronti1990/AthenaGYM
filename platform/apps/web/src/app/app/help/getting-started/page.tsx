import Link from 'next/link';
import { requireAccessToken } from '@/lib/auth/token';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

export default async function GettingStartedPage() {
  await requireAccessToken();

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: 'App', href: '/app' },
          { label: 'Ajuda', href: '/app/help' },
          { label: 'Primeiros passos' },
        ]}
      />
      <h1 className="athena-title text-3xl">Primeiros passos</h1>
      <ol className="list-decimal space-y-3 pl-5 text-sm text-[var(--text)]">
        <li>
          Em{' '}
          <Link className="athena-link text-[var(--gold)]" href="/app/settings">
            Configurações
          </Link>
          , preencha dados da academia, cores e política financeira.
        </li>
        <li>
          Cadastre funcionários em{' '}
          <Link className="athena-link text-[var(--gold)]" href="/app/users">
            Usuários
          </Link>{' '}
          com os cargos corretos.
        </li>
        <li>
          Crie planos e matrículas em{' '}
          <Link className="athena-link text-[var(--gold)]" href="/app/sales">
            Comercial
          </Link>
          .
        </li>
        <li>
          Registre recebimentos em{' '}
          <Link className="athena-link text-[var(--gold)]" href="/app/finance">
            Financeiro
          </Link>
          .
        </li>
        <li>
          Acompanhe o dia a dia no{' '}
          <Link className="athena-link text-[var(--gold)]" href="/app">
            Dashboard
          </Link>
          .
        </li>
      </ol>
    </div>
  );
}
