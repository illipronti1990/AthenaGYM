import Link from 'next/link';
import { PRODUCT_NAME, PRODUCT_VERSION, PRODUCT_YEAR } from './constants';
import { MOVVO_PRODUCT } from '@movvo/shared';

export function LoginFooter() {
  return (
    <footer className="movvo-login-footer" data-testid="login-footer">
      <p>
        {PRODUCT_NAME} · v{PRODUCT_VERSION} · Build {MOVVO_PRODUCT.buildLabel} · © {PRODUCT_YEAR}
      </p>
      <nav aria-label="Institucional">
        <Link href="/privacy">Política de Privacidade</Link>
        <span aria-hidden>·</span>
        <Link href="/terms">Termos de Uso</Link>
      </nav>
    </footer>
  );
}
