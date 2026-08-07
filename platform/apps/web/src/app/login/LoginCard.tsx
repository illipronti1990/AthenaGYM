'use client';

import { Suspense } from 'react';
import { LogoMovvo } from './LogoMovvo';
import { LoginForm } from './LoginForm';
import { BrandLoader } from './BrandLoader';

export function LoginCard() {
  return (
    <section className="movvo-login-card" data-testid="login-card" aria-labelledby="login-card-title">
      <div className="movvo-login-card-head">
        <LogoMovvo tone="mark" size="mark" />
        <h2 id="login-card-title">Entrar na plataforma</h2>
        <p>Acesse com o e-mail e a senha da sua academia.</p>
      </div>
      <Suspense fallback={<BrandLoader label="Carregando formulário…" />}>
        <LoginForm />
      </Suspense>
    </section>
  );
}
