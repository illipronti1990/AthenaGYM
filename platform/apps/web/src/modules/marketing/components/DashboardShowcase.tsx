'use client';

import { useState } from 'react';

const TABS = [
  { id: 'kpis', label: 'KPIs', title: 'Indicadores em tempo real', body: 'Receita, alunos ativos, churn e ocupação em um painel executivo.' },
  { id: 'charts', label: 'Gráficos', title: 'Tendências claras', body: 'Visualize sazonalidade, planos e performance por unidade.' },
  { id: 'calendar', label: 'Calendário', title: 'Agenda viva', body: 'Aulas, turmas e capacidade lado a lado com a operação.' },
  { id: 'finance', label: 'Financeiro', title: 'Caixa sob controle', body: 'Mensalidades, inadimplência e PDV conectados.' },
  { id: 'checkins', label: 'Check-ins', title: 'Fluxo na porta', body: 'Picos de acesso e elegibilidade Wellhub/TotalPass.' },
  { id: 'crm', label: 'CRM', title: 'Pipeline comercial', body: 'Leads, follow-ups e recuperação de alunos.' },
] as const;

export function DashboardShowcase() {
  const [active, setActive] = useState<(typeof TABS)[number]['id']>('kpis');
  const current = TABS.find((t) => t.id === active) || TABS[0];

  return (
    <section id="solucoes" className="movvo-mkt-section movvo-mkt-section-alt" data-testid="dashboard-showcase">
      <div className="movvo-mkt-container">
        <header className="movvo-mkt-section-head">
          <p className="movvo-mkt-kicker">Produto</p>
          <h2 className="movvo-mkt-h2">Dashboard interativo</h2>
          <p className="movvo-mkt-lead">Venda o produto através do próprio produto — visão real do ERP.</p>
        </header>

        <div className="movvo-mkt-showcase">
          <div className="movvo-mkt-showcase-tabs" role="tablist" aria-label="Vistas do dashboard">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active === tab.id}
                className={`movvo-mkt-showcase-tab${active === tab.id ? ' is-active' : ''}`}
                data-testid={`showcase-tab-${tab.id}`}
                onClick={() => setActive(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="movvo-mkt-showcase-panel" role="tabpanel">
            <div className="movvo-mkt-dash-mock">
              <div className="movvo-mkt-dash-top">
                <span className="movvo-mkt-dash-dot" />
                <span className="movvo-mkt-dash-dot" />
                <span className="movvo-mkt-dash-dot" />
                <span className="movvo-mkt-dash-title">{current.label}</span>
              </div>
              <div className="movvo-mkt-showcase-copy">
                <h3>{current.title}</h3>
                <p>{current.body}</p>
              </div>
              <div className="movvo-mkt-dash-chart movvo-mkt-dash-chart--wide">
                {[48, 62, 40, 78, 55, 88, 70, 95].map((h, i) => (
                  <div
                    key={i}
                    className={`movvo-mkt-dash-bar${i === 7 ? ' is-accent' : ''}`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
