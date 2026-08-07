const APP_FEATURES = [
  { title: 'Treinos', desc: 'Acompanhe a ficha onde estiver.' },
  { title: 'Check-in', desc: 'QR Code na porta da academia.' },
  { title: 'Agenda', desc: 'Aulas e horários na palma da mão.' },
  { title: 'Financeiro', desc: 'Mensalidades e status em um toque.' },
] as const;

export function AppShowcase() {
  return (
    <section className="movvo-mkt-section" data-testid="app-showcase">
      <div className="movvo-mkt-container movvo-mkt-app">
        <div className="movvo-mkt-app-copy">
          <p className="movvo-mkt-kicker">Aplicativo</p>
          <h2 className="movvo-mkt-h2">Experiência do aluno no bolso</h2>
          <p className="movvo-mkt-lead">
            Parte do ecossistema Movvo — treinos, check-in, agenda e financeiro no mesmo fluxo.
          </p>
          <ul className="movvo-mkt-app-list">
            {APP_FEATURES.map((f) => (
              <li key={f.title}>
                <strong>{f.title}</strong>
                <span>{f.desc}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="movvo-mkt-phone" aria-hidden>
          <div className="movvo-mkt-phone-screen">
            <p className="movvo-mkt-phone-brand">Movvo</p>
            <div className="movvo-mkt-phone-card">
              <span>Treino A · Superior</span>
              <strong>Hoje · 18:30</strong>
            </div>
            <div className="movvo-mkt-phone-card">
              <span>Check-in</span>
              <strong>QR pronto</strong>
            </div>
            <div className="movvo-mkt-phone-card is-muted">
              <span>Mensalidade</span>
              <strong>Em dia</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
