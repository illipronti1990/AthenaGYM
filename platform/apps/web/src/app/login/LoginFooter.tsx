import Link from 'next/link';
import { ATHENA_PRODUCT, ATHENA_TENANT_NAME, ATHENA_VERSION, ATHENA_YEAR } from './constants';

export function LoginFooter() {
  return (
    <footer className="athena-login-footer" data-testid="login-footer">
      <p>
        {ATHENA_PRODUCT} · Versão {ATHENA_VERSION} · © {ATHENA_YEAR}
      </p>
      <p className="athena-login-footer-tenant">Case: {ATHENA_TENANT_NAME}</p>
      <nav aria-label="Institucional">
        <Link href="/privacy">Política de Privacidade</Link>
        <span aria-hidden>·</span>
        <Link href="/terms">Termos de Uso</Link>
      </nav>
    </footer>
  );
}
