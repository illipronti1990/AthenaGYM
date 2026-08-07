import type { Metadata } from 'next';
import { PlansSection } from '@/modules/marketing/components/PlansSection';
import { PLAN_FAQ } from '@/modules/marketing/data/plans';

export const metadata: Metadata = {
  title: 'Planos Start, Pro e Enterprise — Movvo ERP',
  description:
    'Compare unidades, usuários, professores, alunos, API, white-label, Movvo AI, app e suporte.',
  alternates: { canonical: 'https://movvoerp.com.br/planos' },
};

export default function PlanosPage() {
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: PLAN_FAQ.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <section className="movvo-mkt-section" style={{ paddingBottom: 0 }}>
        <div className="movvo-mkt-container movvo-mkt-section-head">
          <p className="movvo-mkt-kicker">Comercial</p>
          <h1 className="movvo-mkt-h2">Planos Movvo ERP</h1>
          <p className="movvo-mkt-lead">
            Transparência de capacidades para vender com confiança — preços sob consulta.
          </p>
        </div>
      </section>
      <PlansSection standalone />
    </>
  );
}
