'use client';

import Link from 'next/link';
import { MARKETING_PLANS, PLAN_FEATURE_ROWS, PLAN_FAQ } from '../data/plans';
import { trackEvent } from '../lib/analytics';

export function PlansSection({ standalone = false }: { standalone?: boolean }) {
  return (
    <section
      id="planos"
      className={`movvo-mkt-section${standalone ? '' : ' movvo-mkt-section-alt'}`}
      data-testid="plans"
    >
      <div className="movvo-mkt-container">
        <header className="movvo-mkt-section-head">
          <p className="movvo-mkt-kicker">Planos</p>
          <h2 className="movvo-mkt-h2">Escolha o ritmo da sua operação</h2>
          <p className="movvo-mkt-lead">
            Valores sob consulta. Estrutura preparada para cobrança recorrente (billing ready).
          </p>
        </header>

        <div className="movvo-mkt-plans">
          {MARKETING_PLANS.map((plan) => (
            <article
              key={plan.id}
              className={`movvo-mkt-plan${plan.highlight ? ' is-highlight' : ''}`}
              data-testid={`plan-${plan.id}`}
            >
              <h3>{plan.name}</h3>
              <p>{plan.tagline}</p>
              <p className="movvo-mkt-plan-price">Sob consulta</p>
              <Link
                href={`/demonstracao?plan=${plan.planCode}`}
                className="movvo-mkt-btn movvo-mkt-btn-primary"
                data-testid={`plan-cta-${plan.id}`}
                onClick={() => trackEvent('plan_cta_click', { plan: plan.planCode })}
              >
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>

        <div className="movvo-mkt-plan-table-wrap">
          <table className="movvo-mkt-plan-table" data-testid="plans-table">
            <thead>
              <tr>
                <th scope="col">Capacidade</th>
                <th scope="col">Start</th>
                <th scope="col">Pro</th>
                <th scope="col">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {PLAN_FEATURE_ROWS.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td>{row.start}</td>
                  <td>{row.pro}</td>
                  <td>{row.enterprise}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {standalone ? (
          <div className="movvo-mkt-faq-list" style={{ marginTop: '2.5rem' }}>
            {PLAN_FAQ.map((item) => (
              <div key={item.q} className="movvo-mkt-faq-item">
                <p className="movvo-mkt-faq-q" style={{ cursor: 'default' }}>{item.q}</p>
                <p className="movvo-mkt-faq-a">{item.a}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
