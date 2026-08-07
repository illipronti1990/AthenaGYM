import { MARKETING_DIFFERENTIALS } from '../data/differentials';

export function DifferentialsSection() {
  return (
    <section className="movvo-mkt-section movvo-mkt-section-alt" data-testid="differentials">
      <div className="movvo-mkt-container">
        <header className="movvo-mkt-section-head">
          <p className="movvo-mkt-kicker">Diferenciais</p>
          <h2 className="movvo-mkt-h2">Feita para escala e confiança</h2>
        </header>
        <div className="movvo-mkt-diffs">
          {MARKETING_DIFFERENTIALS.map((d) => {
            const Icon = d.icon;
            return (
              <article key={d.id} className="movvo-mkt-diff">
                <Icon size={22} strokeWidth={1.75} aria-hidden />
                <h3>{d.title}</h3>
                <p>{d.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
