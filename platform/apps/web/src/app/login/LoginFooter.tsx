import Link from 'next/link';
import { PRODUCT_NAME, PRODUCT_VERSION, PRODUCT_YEAR, TENANT_DEMO_NAME } from './constants';
import { MOVVO_PRODUCT } from '@athena/shared';

export function LoginFooter() {
  return (
    <footer className="athena-login-footer" data-testid="login-footer">
      <p>
        {PRODUCT_NAME} · v{PRODUCT_VERSION} · Build {MOVVO_PRODUCT.buildLabel} · © {PRODUCT_YEAR}
      </p>
      <p className="athena-login-footer-tenant">Cliente demo: {TENANT_DEMO_NAME}</p>
      <nav aria-label="Institucional">
        <Link href="/privacy">Política de Privacidade</Link>
        <span aria-hidden>·</span>
        <Link href="/terms">Termos de Uso</Link>
      </nav>
    </footer>
  );
}
