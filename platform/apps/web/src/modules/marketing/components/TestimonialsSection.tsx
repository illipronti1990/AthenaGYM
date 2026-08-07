import { DEMO_TESTIMONIALS } from '../data/testimonials';

export function TestimonialsSection() {
  const enabled = process.env.NEXT_PUBLIC_MARKETING_DEMO_SOCIAL === 'true';
  if (!enabled) return null;

  return (
    <section className="movvo-mkt-section movvo-mkt-section-alt" data-testid="testimonials">
      <div className="movvo-mkt-container">
        <header className="movvo-mkt-section-head">
          <p className="movvo-mkt-kicker">Depoimentos</p>
          <h2 className="movvo-mkt-h2">O que gestores comentam</h2>
          <p className="movvo-mkt-lead">Conteúdo de demonstração — substituir por clientes reais antes do lançamento.</p>
        </header>
        <div className="movvo-mkt-testimonials">
          {DEMO_TESTIMONIALS.map((t) => (
            <article key={t.id} className="movvo-mkt-testimonial">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.photo} alt="" width={40} height={40} />
              <div>
                <p className="movvo-mkt-testimonial-stars" aria-label={`${t.rating} de 5`}>
                  {'★'.repeat(t.rating)}
                </p>
                <p className="movvo-mkt-testimonial-comment">“{t.comment}”</p>
                <p className="movvo-mkt-testimonial-meta">
                  <strong>{t.name}</strong> · {t.academy}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
