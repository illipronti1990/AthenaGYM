'use client';

import Link from 'next/link';
import { Logo } from '@movvo/ui';
import { trackEvent } from '../lib/analytics';

export function MarketingHero() {
  return (
    <section className="movvo-mkt-hero" data-testid="marketing-hero" aria-labelledby="hero-title">
      <div className="movvo-mkt-hero-bg" aria-hidden />
      <div className="movvo-mkt-hero-inner">
        <div className="movvo-mkt-hero-copy">
          <div className="movvo-mkt-hero-logo" data-testid="hero-brand">
            <Logo variant="horizontal" tone="brand" className="!justify-start !px-0 !py-0" />
          </div>
          <h1 id="hero-title" className="movvo-mkt-hero-title">
            A gestão inteligente para academias que querem crescer.
          </h1>
          <p className="movvo-mkt-hero-sub">
            Gerencie alunos, financeiro, treinos, agenda, CRM, PDV, estoque e muito mais em uma
            única plataforma.
          </p>
          <div className="movvo-mkt-hero-ctas">
            <Link
              href="/demonstracao"
              className="movvo-mkt-btn movvo-mkt-btn-primary movvo-mkt-btn-lg"
              data-testid="hero-demo-cta"
              onClick={() => trackEvent('demo_cta_click', { placement: 'hero' })}
            >
              Agendar demonstração
            </Link>
            <Link
              href="/login"
              className="movvo-mkt-btn movvo-mkt-btn-secondary movvo-mkt-btn-lg"
              data-testid="hero-login-cta"
              onClick={() => trackEvent('login_cta_click', { placement: 'hero' })}
            >
              Entrar na plataforma
            </Link>
          </div>
        </div>

        <div className="movvo-mkt-hero-visual" aria-hidden>
          <div className="movvo-mkt-dash-mock movvo-mkt-dash-mock--hero" data-testid="hero-dashboard">
            <div className="movvo-mkt-dash-top">
              <span className="movvo-mkt-dash-dot" />
              <span className="movvo-mkt-dash-dot" />
              <span className="movvo-mkt-dash-dot" />
              <span className="movvo-mkt-dash-title">Movvo · Dashboard</span>
            </div>
            <div className="movvo-mkt-dash-kpis">
              <div className="movvo-mkt-dash-kpi">
                <span>Receita</span>
                <strong>R$ 128k</strong>
              </div>
              <div className="movvo-mkt-dash-kpi">
                <span>Check-ins</span>
                <strong>1.842</strong>
              </div>
              <div className="movvo-mkt-dash-kpi">
                <span>Ativos</span>
                <strong>936</strong>
              </div>
            </div>
            <div className="movvo-mkt-dash-chart">
              <div className="movvo-mkt-dash-bar" style={{ height: '42%' }} />
              <div className="movvo-mkt-dash-bar" style={{ height: '68%' }} />
              <div className="movvo-mkt-dash-bar" style={{ height: '55%' }} />
              <div className="movvo-mkt-dash-bar" style={{ height: '82%' }} />
              <div className="movvo-mkt-dash-bar" style={{ height: '70%' }} />
              <div className="movvo-mkt-dash-bar is-accent" style={{ height: '94%' }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
