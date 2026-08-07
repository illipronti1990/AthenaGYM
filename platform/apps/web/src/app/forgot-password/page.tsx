import { LogoMovvo } from '@/app/login/LogoMovvo';
import { ForgotPasswordForm } from '@/modules/auth/ForgotPasswordForm';
import { PRODUCT_NAME, PRODUCT_SLOGAN } from '@/app/login/constants';
import '../login/login.css';

export default function ForgotPasswordPage() {
  return (
    <main className="movvo-login-page" style={{ gridTemplateColumns: '1fr' }}>
      <div className="movvo-login-panel" style={{ minHeight: '100vh' }}>
        <section className="movvo-login-card">
          <div className="movvo-login-card-head">
            <LogoMovvo tone="mark" size="mark" />
            <h1 id="forgot-title" style={{ marginTop: 14, fontSize: '1.35rem', fontWeight: 700 }}>
              Recuperar senha
            </h1>
            <p>
              {PRODUCT_NAME} · {PRODUCT_SLOGAN}
            </p>
          </div>
          <ForgotPasswordForm />
        </section>
      </div>
    </main>
  );
}
