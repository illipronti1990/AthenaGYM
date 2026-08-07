import type { Metadata } from 'next';
import Link from 'next/link';
import { DOC_PAGES } from '@/modules/marketing/content/docs';

export const metadata: Metadata = {
  title: 'Developers — Movvo ERP',
  description: 'API, autenticação, webhooks e documentação técnica.',
  alternates: { canonical: 'https://movvoerp.com.br/developers' },
};

const API_DOCS = (process.env.NEXT_PUBLIC_API_URL || 'https://api.movvoerp.com.br/api/v1').replace(
  /\/api\/v1$/,
  '/api/v1/docs',
);

export default function DevelopersPage() {
  return (
    <section className="movvo-mkt-section" data-testid="developers-page">
      <div className="movvo-mkt-container">
        <header className="movvo-mkt-section-head">
          <p className="movvo-mkt-kicker">Developers</p>
          <h1 className="movvo-mkt-h2">Portal técnico Movvo</h1>
          <p className="movvo-mkt-lead">
            Referência pública. Chaves e sandbox ficam no portal autenticado em /app/developers.
          </p>
          <a href={API_DOCS} className="movvo-mkt-btn movvo-mkt-btn-primary" target="_blank" rel="noreferrer">
            Abrir Swagger
          </a>
        </header>
        <div className="movvo-mkt-modules">
          {DOC_PAGES.map((doc) => (
            <article key={doc.slug} className="movvo-mkt-module">
              <h2 className="movvo-mkt-module-title">
                <Link href={`/developers/${doc.slug}`}>{doc.title}</Link>
              </h2>
              <p className="movvo-mkt-module-desc">{doc.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
