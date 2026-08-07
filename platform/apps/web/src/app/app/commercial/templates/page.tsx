import Link from 'next/link';
import { requireAccessToken } from '@/lib/auth/token';

const TEMPLATES = [
  { id: 'welcome', name: 'Boas-vindas', desc: 'Após go-live do cliente.' },
  { id: 'password_recovery', name: 'Recuperação de senha', desc: 'Wrapper de marca (fluxo Supabase).' },
  { id: 'invite', name: 'Convite', desc: 'Convite de usuário staff.' },
  { id: 'demo_confirmation', name: 'Confirmação de demonstração', desc: 'Enviado ao lead após o formulário.' },
  { id: 'plan_update', name: 'Atualização de plano', desc: 'Upgrade/downgrade comercial.' },
  { id: 'notice', name: 'Avisos', desc: 'Comunicados gerais da plataforma.' },
];

export default async function CommercialTemplatesPage() {
  await requireAccessToken();
  return (
    <div className="space-y-4" data-testid="commercial-templates">
      <div className="flex items-center justify-between">
        <h1 className="movvo-title text-3xl">Templates de e-mail Movvo</h1>
        <Link href="/app/commercial" className="movvo-link text-sm text-[var(--gold)]">← CRM</Link>
      </div>
      <p className="text-sm text-[var(--muted)]">
        Envio via Resend (`RESEND_API_KEY`). Sem chave, o lead continua sendo gravado e o e-mail é apenas logado.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {TEMPLATES.map((t) => (
          <article key={t.id} className="rounded-xl border border-[var(--border)] p-4">
            <h2 className="font-semibold">{t.name}</h2>
            <p className="text-sm text-[var(--muted)]">{t.desc}</p>
            <code className="text-xs text-[var(--gold)]">{t.id}</code>
          </article>
        ))}
      </div>
    </div>
  );
}
