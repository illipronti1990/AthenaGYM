'use client';

import { useEffect, useState } from 'react';

type Health = {
  status?: string;
  timestamp?: string;
  checks?: Record<string, { status?: string; error?: string }>;
};

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function StatusClient() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/health`, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setHealth)
      .catch((e) => setError(e instanceof Error ? e.message : 'Falha'));
  }, []);

  const items = [
    { key: 'api', label: 'API' },
    { key: 'database', label: 'Banco de dados' },
    { key: 'supabase', label: 'Autenticação / Supabase' },
    { key: 'storage', label: 'Integrações / Storage' },
  ];

  return (
    <div className="movvo-mkt-container" data-testid="status-page">
      <header className="movvo-mkt-section-head">
        <p className="movvo-mkt-kicker">Status</p>
        <h1 className="movvo-mkt-h2">Saúde da plataforma</h1>
        <p className="movvo-mkt-lead">
          {health?.timestamp ? `Atualizado em ${new Date(health.timestamp).toLocaleString('pt-BR')}` : 'Carregando…'}
        </p>
      </header>
      {error ? <p className="movvo-mkt-form-error">{error}</p> : null}
      <div className="movvo-mkt-integrations">
        {items.map((item) => {
          const st = health?.checks?.[item.key]?.status || (health ? 'unknown' : '…');
          const ok = st === 'ok';
          return (
            <article key={item.key} className="movvo-mkt-integration" data-testid={`status-${item.key}`}>
              <div className="movvo-mkt-integration-head">
                <h3>{item.label}</h3>
                <span className={`movvo-mkt-badge${ok ? ' is-ok' : ' is-soon'}`}>{String(st)}</span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
