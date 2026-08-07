import { MARKETING_INTEGRATIONS } from '../data/integrations';

export function IntegrationsSection() {
  return (
    <section id="integracoes" className="movvo-mkt-section" data-testid="integrations">
      <div className="movvo-mkt-container">
        <header className="movvo-mkt-section-head">
          <p className="movvo-mkt-kicker">Integrações</p>
          <h2 className="movvo-mkt-h2">Conectada ao ecossistema da academia</h2>
          <p className="movvo-mkt-lead">Parceiros disponíveis e roadmap transparente.</p>
        </header>
        <div className="movvo-mkt-integrations">
          {MARKETING_INTEGRATIONS.map((item) => (
            <article key={item.id} className="movvo-mkt-integration" data-testid={`integration-${item.id}`}>
              <div className="movvo-mkt-integration-head">
                <h3>{item.name}</h3>
                <span
                  className={`movvo-mkt-badge${item.status === 'available' ? ' is-ok' : ' is-soon'}`}
                >
                  {item.status === 'available' ? 'Disponível' : 'Em breve'}
                </span>
              </div>
              <p>{item.blurb}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
