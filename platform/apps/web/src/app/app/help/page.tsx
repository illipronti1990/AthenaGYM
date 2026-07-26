import Link from 'next/link';
import { requireAccessToken } from '@/lib/auth/token';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card } from '@athena/ui';

export default async function HelpPage() {
  await requireAccessToken();

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'App', href: '/app' }, { label: 'Ajuda' }]} />
      <div>
        <h1 className="athena-title text-3xl">Central de Ajuda</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Manual rápido do Athena para academias de bairro.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/app/help/getting-started">
          <Card hover>
            <h2 className="athena-title text-base">Primeiros passos</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Configure a academia e comece a operar
            </p>
          </Card>
        </Link>
        <Link href="/app/help/faq">
          <Card hover>
            <h2 className="athena-title text-base">FAQ</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Perguntas frequentes</p>
          </Card>
        </Link>
      </div>
      <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text)]">
        <li>Use Ctrl+K para pesquisar alunos, pagamentos e treinos</li>
        <li>Fixe telas favoritas na Home</li>
        <li>Exporte listas em CSV, Excel ou PDF</li>
        <li>Alterne o tema claro/escuro no cabeçalho</li>
      </ul>
    </div>
  );
}
