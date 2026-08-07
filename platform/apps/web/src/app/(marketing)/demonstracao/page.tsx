import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DemoRequestForm } from '@/modules/marketing/components/DemoRequestForm';

export const metadata: Metadata = {
  title: 'Solicitar demonstração — Movvo ERP',
  description: 'Agende uma demonstração personalizada do Movvo ERP para a sua academia.',
  alternates: { canonical: 'https://movvoerp.com.br/demonstracao' },
};

export default function DemonstracaoPage() {
  return (
    <section className="movvo-mkt-section" data-testid="demonstracao-page">
      <div className="movvo-mkt-container movvo-mkt-contact">
        <header className="movvo-mkt-section-head">
          <p className="movvo-mkt-kicker">Demonstração</p>
          <h1 className="movvo-mkt-h2">Agende uma demonstração</h1>
          <p className="movvo-mkt-lead">
            Preencha os dados. Confirmamos o recebimento e nossa equipe comercial retorna em breve.
          </p>
        </header>
        <Suspense fallback={<p className="movvo-mkt-lead">Carregando formulário…</p>}>
          <DemoRequestForm redirectOnSuccess />
        </Suspense>
      </div>
    </section>
  );
}
