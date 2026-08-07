'use client';

import { useState } from 'react';
import { MARKETING_FAQ } from '../data/faq';

export function FaqSection() {
  const [openId, setOpenId] = useState<string | null>(MARKETING_FAQ[0]?.id ?? null);

  return (
    <section className="movvo-mkt-section" data-testid="faq">
      <div className="movvo-mkt-container movvo-mkt-faq">
        <header className="movvo-mkt-section-head">
          <p className="movvo-mkt-kicker">FAQ</p>
          <h2 className="movvo-mkt-h2">Perguntas frequentes</h2>
        </header>
        <div className="movvo-mkt-faq-list">
          {MARKETING_FAQ.map((item) => {
            const open = openId === item.id;
            return (
              <div key={item.id} className="movvo-mkt-faq-item">
                <button
                  type="button"
                  className="movvo-mkt-faq-q"
                  aria-expanded={open}
                  data-testid={`faq-${item.id}`}
                  onClick={() => setOpenId(open ? null : item.id)}
                >
                  {item.question}
                </button>
                {open ? <p className="movvo-mkt-faq-a">{item.answer}</p> : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
