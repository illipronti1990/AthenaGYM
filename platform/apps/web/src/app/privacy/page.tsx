import Link from 'next/link';
import { PRODUCT_NAME, PRODUCT_YEAR } from '@/app/login/constants';

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 text-[var(--text)]">
      <h1 className="movvo-h1">Política de Privacidade</h1>
      <p className="movvo-muted mt-3 text-sm">
        {PRODUCT_NAME} · © {PRODUCT_YEAR}. Esta página descreve, em linguagem simples, como tratamos
        dados operacionais da academia (alunos, financeiro e acesso).
      </p>
      <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-[var(--muted)]">
        <li>Dados são usados apenas para operação do sistema e obrigações legais.</li>
        <li>Acesso é controlado por autenticação e permissões por perfil.</li>
        <li>Logs de segurança (como tentativas de login) podem ser registrados para auditoria.</li>
      </ul>
      <Link href="/login" className="movvo-link mt-8 inline-block text-[var(--gold)]">
        Voltar ao login
      </Link>
    </main>
  );
}
