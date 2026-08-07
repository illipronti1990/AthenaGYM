import type { Metadata } from 'next';
import { Suspense } from 'react';
import DemoThanksClient from './DemoThanksClient';

export const metadata: Metadata = {
  title: 'Demonstração confirmada — Movvo ERP',
  robots: { index: false, follow: false },
};

export default function DemonstracaoObrigadoPage() {
  return (
    <Suspense fallback={<section className="movvo-mkt-section"><div className="movvo-mkt-container"><p>Carregando…</p></div></section>}>
      <DemoThanksClient />
    </Suspense>
  );
}
