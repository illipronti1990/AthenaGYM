import type { Metadata } from 'next';
import { LoginBackground } from './LoginBackground';
import { LoginHeader } from './LoginHeader';
import { LoginCard } from './LoginCard';
import { LoginFooter } from './LoginFooter';
import { ATHENA_PRODUCT, ATHENA_SLOGAN, ATHENA_VERSION } from './constants';
import './login.css';

export const metadata: Metadata = {
  title: `Entrar · ${ATHENA_PRODUCT}`,
  description: ATHENA_SLOGAN,
};

export default function LoginPage() {
  return (
    <main className="athena-login-page" data-testid="login-page">
      <LoginBackground />
      <LoginHeader />
      <div className="athena-login-panel">
        <LoginCard />
        <LoginFooter />
        <p className="sr-only">
          {ATHENA_PRODUCT} versão {ATHENA_VERSION}
        </p>
      </div>
    </main>
  );
}
