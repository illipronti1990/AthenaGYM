import { requireAccessToken } from '@/lib/auth/token';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card } from '@athena/ui';

const FAQ = [
  {
    q: 'Como pesquisar um aluno rapidamente?',
    a: 'Pressione Ctrl+K (ou Cmd+K) e digite o nome, matrícula ou CPF.',
  },
  {
    q: 'Como gerar backup?',
    a: 'Em Configurações → Backup → Backup Manual. O arquivo JSON fica disponível para download.',
  },
  {
    q: 'Como mudar o tema?',
    a: 'Use o botão Claro/Escuro no cabeçalho ou salve a preferência em Meu perfil.',
  },
  {
    q: 'Onde vejo logs de auditoria?',
    a: 'Em Logs (menu) ou Configurações → Logs. Requer permissão audit.read.',
  },
];

export default async function FaqPage() {
  await requireAccessToken();

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: 'App', href: '/app' },
          { label: 'Ajuda', href: '/app/help' },
          { label: 'FAQ' },
        ]}
      />
      <h1 className="athena-title text-3xl">FAQ</h1>
      <dl className="space-y-4">
        {FAQ.map((item) => (
          <Card key={item.q}>
            <dt className="athena-title text-base">{item.q}</dt>
            <dd className="mt-1 text-sm text-[var(--muted)]">{item.a}</dd>
          </Card>
        ))}
      </dl>
    </div>
  );
}
