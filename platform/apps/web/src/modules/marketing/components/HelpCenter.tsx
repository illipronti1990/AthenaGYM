'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { HELP_ARTICLES, HELP_CATEGORIES, searchHelp } from '../content/help';

export function HelpCenter({
  category,
  slug,
}: {
  category?: string;
  slug?: string;
}) {
  const [q, setQ] = useState('');
  const results = useMemo(() => searchHelp(q), [q]);
  const article = category && slug
    ? HELP_ARTICLES.find((a) => a.category === category && a.slug === slug)
    : null;

  if (article) {
    return (
      <article className="movvo-mkt-container" data-testid="help-article" style={{ maxWidth: 760 }}>
        <p className="movvo-mkt-kicker">{article.categoryLabel}</p>
        <h1 className="movvo-mkt-h2">{article.title}</h1>
        <p className="movvo-mkt-lead">{article.description}</p>
        <div className="movvo-mkt-prose" style={{ whiteSpace: 'pre-wrap', color: 'var(--mkt-muted)', lineHeight: 1.6 }}>
          {article.body}
        </div>
        <p style={{ marginTop: '2rem' }}>
          <Link href="/ajuda" className="movvo-mkt-btn movvo-mkt-btn-secondary">Voltar à ajuda</Link>
        </p>
      </article>
    );
  }

  return (
    <div className="movvo-mkt-container" data-testid="help-center">
      <header className="movvo-mkt-section-head">
        <p className="movvo-mkt-kicker">Central de Ajuda</p>
        <h1 className="movvo-mkt-h2">Como podemos ajudar?</h1>
        <input
          className="movvo-mkt-search"
          data-testid="help-search"
          placeholder="Buscar artigos…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{
            width: 'min(480px, 100%)',
            margin: '1rem auto 0',
            display: 'block',
            background: 'var(--mkt-surface)',
            border: '1px solid var(--mkt-border)',
            borderRadius: '0.55rem',
            padding: '0.75rem 1rem',
            color: 'var(--mkt-text)',
          }}
        />
      </header>

      <div className="movvo-mkt-integrations" style={{ marginBottom: '2rem' }}>
        {HELP_CATEGORIES.map((c) => (
          <div key={c.id} className="movvo-mkt-integration">
            <h3>{c.label}</h3>
            <ul className="movvo-mkt-footer-list">
              {HELP_ARTICLES.filter((a) => a.category === c.id).map((a) => (
                <li key={a.slug}>
                  <Link href={`/ajuda/${a.category}/${a.slug}`}>{a.title}</Link>
                </li>
              ))}
              {HELP_ARTICLES.every((a) => a.category !== c.id) ? (
                <li style={{ color: 'var(--mkt-muted)' }}>Em breve</li>
              ) : null}
            </ul>
          </div>
        ))}
      </div>

      {q ? (
        <div>
          <h2 className="movvo-mkt-h2" style={{ fontSize: '1.25rem' }}>Resultados</h2>
          <ul className="movvo-mkt-footer-list">
            {results.map((a) => (
              <li key={`${a.category}-${a.slug}`}>
                <Link href={`/ajuda/${a.category}/${a.slug}`}>{a.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
