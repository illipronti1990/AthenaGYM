import type { Metadata } from 'next';
import Link from 'next/link';
import { MOVVO_PRODUCT } from '@athena/shared';

export const metadata: Metadata = {
  title: 'Contato — Movvo ERP',
  description: 'Fale com a Movvo por WhatsApp, e-mail ou solicite uma demonstração.',
  alternates: { canonical: 'https://movvoerp.com.br/contato' },
};

const WA = process.env.NEXT_PUBLIC_WHATSAPP_SALES || '5511999999999';

export default function ContatoPage() {
  const waUrl = `https://wa.me/${WA.replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Quero saber mais sobre o Movvo ERP.')}`;

  return (
    <section className="movvo-mkt-section" data-testid="contato-page">
      <div className="movvo-mkt-container">
        <header className="movvo-mkt-section-head">
          <p className="movvo-mkt-kicker">Contato</p>
          <h1 className="movvo-mkt-h2">Fale com a Movvo</h1>
          <p className="movvo-mkt-lead">Escolha o canal — ou solicite uma demonstração guiada.</p>
        </header>
        <div className="movvo-mkt-diffs">
          <article className="movvo-mkt-diff">
            <h3>WhatsApp</h3>
            <p>Atendimento comercial rápido.</p>
            <a href={waUrl} className="movvo-mkt-btn movvo-mkt-btn-primary" target="_blank" rel="noreferrer">
              Abrir WhatsApp
            </a>
          </article>
          <article className="movvo-mkt-diff">
            <h3>E-mail</h3>
            <p>{MOVVO_PRODUCT.supportEmail}</p>
            <a href={`mailto:${MOVVO_PRODUCT.supportEmail}`} className="movvo-mkt-btn movvo-mkt-btn-secondary">
              Enviar e-mail
            </a>
          </article>
          <article className="movvo-mkt-diff">
            <h3>Demonstração</h3>
            <p>Formulário completo com interesse e plano.</p>
            <Link href="/demonstracao" className="movvo-mkt-btn movvo-mkt-btn-primary">
              Solicitar demonstração
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
