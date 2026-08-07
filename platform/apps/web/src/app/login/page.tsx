import type { Metadata } from 'next';
import { LoginBackground } from './LoginBackground';
import { LoginHeader } from './LoginHeader';
import { LoginCard } from './LoginCard';
import { LoginFooter } from './LoginFooter';
import { PRODUCT_NAME, PRODUCT_SLOGAN, PRODUCT_VERSION } from './constants';
import './login.css';

export const metadata: Metadata = {
  title: `Entrar · ${PRODUCT_NAME}`,
  description: PRODUCT_SLOGAN,
};

export default function LoginPage() {
  return (
    <main className="movvo-login-page movvo-login-page" data-testid="login-page">
      <LoginBackground />
      <LoginHeader />
      <div className="movvo-login-panel">
        <LoginCard />
        <LoginFooter />
        <p className="sr-only">
          {PRODUCT_NAME} versão {PRODUCT_VERSION}
        </p>
      </div>
    </main>
  );
}
