import { LogoMovvo } from './LogoMovvo';
import { LOGIN_FEATURES, PRODUCT_NAME, PRODUCT_SLOGAN, TENANT_DEMO_NAME } from './constants';

export function LoginHeader() {
  return (
    <aside className="movvo-login-brand movvo-login-brand" data-testid="login-brand">
      <div className="movvo-login-brand-inner">
        <LogoMovvo tone="mark" size="mark" />
        <p className="movvo-login-brand-name font-display">{PRODUCT_NAME}</p>
        <p className="movvo-login-tenant">Case: {TENANT_DEMO_NAME}</p>
        <h1 className="movvo-login-slogan font-display">{PRODUCT_SLOGAN}</h1>
        <p className="movvo-login-brand-desc">
          Tecnologia moderna, simples e inteligente para academias que querem crescer com controle.
        </p>
        <ul className="movvo-login-features">
          {LOGIN_FEATURES.map((item) => (
            <li key={item}>
              <span className="movvo-login-feature-dot" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
