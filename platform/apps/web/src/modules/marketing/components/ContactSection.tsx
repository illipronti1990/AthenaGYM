'use client';

import Link from 'next/link';
import { trackEvent } from '../lib/analytics';

export function ContactSection() {
  return (
    <section id="contato" className="movvo-mkt-section movvo-mkt-section-alt" data-testid="contact">
      <div className="movvo-mkt-container movvo-mkt-contact">
        <header className="movvo-mkt-section-head">
          <p className="movvo-mkt-kicker">Contato</p>
          <h2 className="movvo-mkt-h2">Agende uma demonstração</h2>
          <p className="movvo-mkt-lead">
            Conte um pouco sobre sua academia. Retornamos com uma demo personalizada.
          </p>
        </header>
        <div className="movvo-mkt-hero-ctas" style={{ justifyContent: 'center' }}>
          <Link
            href="/demonstracao"
            className="movvo-mkt-btn movvo-mkt-btn-primary movvo-mkt-btn-lg"
            data-testid="home-demo-cta"
            onClick={() => trackEvent('demo_cta_click', { placement: 'home_contact' })}
          >
            Solicitar demonstração
          </Link>
          <Link href="/contato" className="movvo-mkt-btn movvo-mkt-btn-secondary movvo-mkt-btn-lg">
            Ver canais de contato
          </Link>
        </div>
      </div>
    </section>
  );
}
