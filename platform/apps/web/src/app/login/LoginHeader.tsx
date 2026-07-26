import { LogoAthena } from './LogoAthena';
import { ATHENA_SLOGAN, ATHENA_TENANT_NAME, LOGIN_FEATURES } from './constants';

export function LoginHeader() {
  return (
    <aside className="athena-login-brand" data-testid="login-brand">
      <div className="athena-login-brand-inner">
        <LogoAthena tone="mark" size="mark" />
        <p className="athena-login-brand-name">ATHENA</p>
        <p className="athena-login-tenant">{ATHENA_TENANT_NAME}</p>
        <h1 className="athena-login-slogan">{ATHENA_SLOGAN}</h1>
        <p className="athena-login-brand-desc">
          O ERP completo para sua academia — financeiro, operação e experiência do aluno em um só lugar.
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
