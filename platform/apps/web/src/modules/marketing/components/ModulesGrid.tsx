import { MARKETING_MODULES } from '../data/modules';

export function ModulesGrid() {
  return (
    <section id="recursos" className="movvo-mkt-section" data-testid="modules-grid">
      <div className="movvo-mkt-container">
        <header className="movvo-mkt-section-head">
          <p className="movvo-mkt-kicker">Recursos</p>
          <h2 className="movvo-mkt-h2">Módulos do sistema</h2>
          <p className="movvo-mkt-lead">
            Tudo que a academia precisa para operar, crescer e decidir com dados.
          </p>
        </header>
        <div className="movvo-mkt-modules">
          {MARKETING_MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <article key={mod.id} className="movvo-mkt-module" data-testid={`module-${mod.id}`}>
                <div className="movvo-mkt-module-icon" aria-hidden>
                  <Icon size={22} strokeWidth={1.75} />
                </div>
                <h3 className="movvo-mkt-module-title">{mod.title}</h3>
                <p className="movvo-mkt-module-desc">{mod.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
