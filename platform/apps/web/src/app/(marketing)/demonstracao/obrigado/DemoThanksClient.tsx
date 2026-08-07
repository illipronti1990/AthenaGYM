'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackEvent } from '@/modules/marketing/lib/analytics';

export default function DemoThanksClient() {
  const search = useSearchParams();
  const id = search.get('id');
  const academy = search.get('academy');

  useEffect(() => {
    trackEvent('demo_thanks_view', { id: id || '' });
  }, [id]);

  return (
    <section className="movvo-mkt-section" data-testid="demo-thanks">
      <div className="movvo-mkt-container" style={{ textAlign: 'center', maxWidth: 640 }}>
        <p className="movvo-mkt-kicker">Confirmado</p>
        <h1 className="movvo-mkt-h2">Recebemos sua solicitação</h1>
        <p className="movvo-mkt-lead">
          {academy
            ? `Obrigado! Em breve falamos com a equipe da ${academy}.`
            : 'Obrigado! Em breve nossa equipe comercial entra em contato.'}
        </p>
        {id ? (
          <p className="movvo-mkt-footer-meta" style={{ marginTop: '1rem' }}>
            Protocolo: <code>{id}</code>
          </p>
        ) : null}
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'center',
            marginTop: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          <Link href="/planos" className="movvo-mkt-btn movvo-mkt-btn-secondary">
            Ver planos
          </Link>
          <Link href="/" className="movvo-mkt-btn movvo-mkt-btn-primary">
            Voltar ao início
          </Link>
        </div>
      </div>
    </section>
  );
}
