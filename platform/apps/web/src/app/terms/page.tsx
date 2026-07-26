import Link from 'next/link';
import { ATHENA_PRODUCT, ATHENA_YEAR } from '@/app/login/constants';

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 text-[var(--text)]">
      <h1 className="athena-h1">Termos de Uso</h1>
      <p className="athena-muted mt-3 text-sm">
        {ATHENA_PRODUCT} · © {ATHENA_YEAR}. Ao utilizar a plataforma, você concorda em usar o sistema
        de forma responsável, respeitando a legislação e os dados dos alunos e colaboradores.
      </p>
      <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-[var(--muted)]">
        <li>Credenciais são pessoais e intransferíveis.</li>
        <li>O uso indevido pode resultar em suspensão do acesso.</li>
        <li>A academia é responsável pela veracidade dos dados cadastrados.</li>
      </ul>
      <Link href="/login" className="athena-link mt-8 inline-block text-[var(--gold)]">
        Voltar ao login
      </Link>
    </main>
  );
}
