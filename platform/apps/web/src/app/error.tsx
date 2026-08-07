'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { MOVVO_PRODUCT } from '@athena/shared';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--background)] px-6 text-center text-[var(--text)]"
      data-testid="error-page-500"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={MOVVO_PRODUCT.assets.logo} alt="Movvo ERP" width={160} height={40} />
      <p className="text-sm uppercase tracking-[0.2em] text-[var(--error)]">Erro</p>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
        Algo deu errado
      </h1>
      <p className="max-w-md text-[var(--muted)]">
        {MOVVO_PRODUCT.slogan} Tente novamente ou volte ao painel.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-[var(--radius-btn)] bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Tentar de novo
        </button>
        <Link
          href="/app"
          className="rounded-[var(--radius-btn)] border border-[var(--border)] px-5 py-2.5 text-sm font-semibold"
        >
          Ir ao início
        </Link>
      </div>
    </main>
  );
}
