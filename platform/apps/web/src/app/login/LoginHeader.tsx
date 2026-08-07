import { LogoMovvo } from './LogoMovvo';
import { LOGIN_FEATURES, PRODUCT_NAME, PRODUCT_SLOGAN, TENANT_DEMO_NAME } from './constants';

export function LoginHeader() {
  return (
    <aside className="athena-login-brand movvo-login-brand" data-testid="login-brand">
      <div className="athena-login-brand-inner">
        <LogoMovvo tone="mark" size="mark" />
        <p className="athena-login-brand-name font-display">{PRODUCT_NAME}</p>
        <p className="athena-login-tenant">Case: {TENANT_DEMO_NAME}</p>
        <h1 className="athena-login-slogan font-display">{PRODUCT_SLOGAN}</h1>
        <p className="athena-login-brand-desc">
          Tecnologia moderna, simples e inteligente para academias que querem crescer com controle.
        </p>
        <ul className="athena-login-features">
          {LOGIN_FEATURES.map((item) => (
            <li key={item}>
              <span className="athena-login-feature-dot" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
