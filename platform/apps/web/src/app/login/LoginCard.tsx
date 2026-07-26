'use client';

import { Suspense } from 'react';
import { LogoAthena } from './LogoAthena';
import { LoginForm } from './LoginForm';
import { AthenaLoader } from './AthenaLoader';

export function LoginCard() {
  return (
    <section className="athena-login-card" data-testid="login-card" aria-labelledby="login-card-title">
      <div className="athena-login-card-head">
        <LogoAthena tone="mark" size="mark" />
        <h2 id="login-card-title">Entrar na plataforma</h2>
        <p>Acesse com o e-mail e a senha da sua academia.</p>
      </div>
      <Suspense fallback={<AthenaLoader label="Carregando formulário…" />}>
        <LoginForm />
      </Suspense>
    </section>
  );
}
