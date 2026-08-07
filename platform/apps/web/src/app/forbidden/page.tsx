import Link from 'next/link';
import { MOVVO_PRODUCT } from '@movvo/shared';

export default function ForbiddenPage() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--background)] px-6 text-center text-[var(--text)]"
      data-testid="error-page-403"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={MOVVO_PRODUCT.assets.logo} alt="Movvo ERP" width={160} height={40} />
      <p className="text-sm uppercase tracking-[0.2em] text-[var(--warning)]">403</p>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
        Acesso negado
      </h1>
      <p className="max-w-md text-[var(--muted)]">
        Você não tem permissão para esta área. {MOVVO_PRODUCT.slogan}
      </p>
      <Link
        href="/app"
        className="rounded-[var(--radius-btn)] bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
