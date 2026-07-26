import { LogoAthena } from '@/app/login/LogoAthena';
import { ForgotPasswordForm } from '@/modules/auth/ForgotPasswordForm';
import { ATHENA_PRODUCT, ATHENA_SLOGAN } from '@/app/login/constants';
import '../login/login.css';

export default function ForgotPasswordPage() {
  return (
    <main className="athena-login-page" style={{ gridTemplateColumns: '1fr' }}>
      <div className="athena-login-panel" style={{ minHeight: '100vh' }}>
        <section className="athena-login-card">
          <div className="athena-login-card-head">
            <LogoAthena tone="mark" size="mark" />
            <h1 id="forgot-title" style={{ marginTop: 14, fontSize: '1.35rem', fontWeight: 700 }}>
              Recuperar senha
            </h1>
            <p>
              {ATHENA_PRODUCT} · {ATHENA_SLOGAN}
            </p>
          </div>
          <ForgotPasswordForm />
        </section>
      </div>
    </main>
  );
}
