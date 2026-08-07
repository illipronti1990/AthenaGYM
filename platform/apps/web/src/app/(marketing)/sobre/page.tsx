import type { Metadata } from 'next';
import { MOVVO_PRODUCT } from '@athena/shared';

export const metadata: Metadata = {
  title: 'Sobre a Movvo — ERP para academias',
  description: `${MOVVO_PRODUCT.mission} ${MOVVO_PRODUCT.vision}`,
  alternates: { canonical: 'https://movvoerp.com.br/sobre' },
};

export default function SobrePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'Sobre a Movvo',
    description: MOVVO_PRODUCT.mission,
  };

  return (
    <section className="movvo-mkt-section" data-testid="sobre-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="movvo-mkt-container" style={{ maxWidth: 800 }}>
        <header className="movvo-mkt-section-head" style={{ textAlign: 'left', marginInline: 0 }}>
          <p className="movvo-mkt-kicker">Sobre</p>
          <h1 className="movvo-mkt-h2">A história da Movvo</h1>
          <p className="movvo-mkt-lead">{MOVVO_PRODUCT.slogan}</p>
        </header>
        <div className="movvo-mkt-diffs">
          <article className="movvo-mkt-diff">
            <h3>Missão</h3>
            <p>{MOVVO_PRODUCT.mission}</p>
          </article>
          <article className="movvo-mkt-diff">
            <h3>Visão</h3>
            <p>{MOVVO_PRODUCT.vision}</p>
          </article>
        </div>
        <h2 className="movvo-mkt-h2" style={{ fontSize: '1.35rem', marginTop: '2rem' }}>Valores</h2>
        <ul className="movvo-mkt-app-list">
          {MOVVO_PRODUCT.values.map((v) => (
            <li key={v}><strong>{v}</strong></li>
          ))}
        </ul>
        <h2 className="movvo-mkt-h2" style={{ fontSize: '1.35rem', marginTop: '2rem' }}>Equipe</h2>
        <p className="movvo-mkt-lead">Em breve apresentaremos o time por trás da Movvo.</p>
      </div>
    </section>
  );
}
