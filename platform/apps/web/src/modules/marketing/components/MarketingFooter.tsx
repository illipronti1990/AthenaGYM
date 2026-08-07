import Link from 'next/link';
import { MOVVO_PRODUCT } from '@movvo/shared';
import { Logo } from '@movvo/ui';

const PRODUCT = [
  { href: '/planos', label: 'Planos' },
  { href: '/demonstracao', label: 'Demonstração' },
  { href: '/ajuda', label: 'Ajuda' },
  { href: '/blog', label: 'Blog' },
  { href: '/developers', label: 'Developers' },
  { href: '/status', label: 'Status' },
];

const COMPANY = [
  { href: '/sobre', label: 'Sobre' },
  { href: '/contato', label: 'Contato' },
  { href: '/privacy', label: 'Política de Privacidade' },
  { href: '/terms', label: 'Termos de Uso' },
];

export function MarketingFooter() {
  return (
    <footer className="movvo-mkt-footer" data-testid="marketing-footer">
      <div className="movvo-mkt-footer-grid">
        <div className="movvo-mkt-footer-brand">
          <Logo variant="horizontal" tone="brand" className="!justify-start !px-0 !py-0" />
          <p className="movvo-mkt-footer-slogan">{MOVVO_PRODUCT.slogan}</p>
          <p className="movvo-mkt-footer-meta">
            {MOVVO_PRODUCT.name} · v{MOVVO_PRODUCT.version} · Build {MOVVO_PRODUCT.buildLabel}
          </p>
        </div>

        <div>
          <p className="movvo-mkt-footer-heading">Produto</p>
          <ul className="movvo-mkt-footer-list">
            {PRODUCT.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="movvo-mkt-footer-heading">Empresa</p>
          <ul className="movvo-mkt-footer-list">
            {COMPANY.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
            <li>
              <Link href="/privacy">LGPD</Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="movvo-mkt-footer-heading">Contato</p>
          <ul className="movvo-mkt-footer-list">
            <li>
              <a href={`mailto:${MOVVO_PRODUCT.supportEmail}`}>{MOVVO_PRODUCT.supportEmail}</a>
            </li>
            <li>
              <a href={MOVVO_PRODUCT.url} rel="noreferrer">
                {MOVVO_PRODUCT.domain}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="movvo-mkt-footer-bottom">
        <p>© {new Date().getFullYear()} {MOVVO_PRODUCT.name}. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
