'use client';

import Link from 'next/link';
import { trackEvent } from '../lib/analytics';

export function FinalCta() {
  return (
    <section className="movvo-mkt-final-cta" data-testid="final-cta">
      <div className="movvo-mkt-container">
        <h2 className="movvo-mkt-h2">Pronto para transformar a gestão da sua academia?</h2>
        <Link
          href="/demonstracao"
          className="movvo-mkt-btn movvo-mkt-btn-primary movvo-mkt-btn-lg"
          data-testid="final-demo-cta"
          onClick={() => trackEvent('demo_cta_click', { placement: 'final_cta' })}
        >
          Solicitar demonstração
        </Link>
      </div>
    </section>
  );
}
