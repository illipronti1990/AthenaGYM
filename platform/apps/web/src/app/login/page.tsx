import { Suspense } from 'react';
import { Logo } from '@athena/ui';
import { LoginForm } from '@/modules/auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse at top, rgba(160,0,24,0.22), transparent 55%), radial-gradient(ellipse at bottom, rgba(212,175,55,0.08), transparent 50%), var(--background)',
        }}
      />
      <div>
        <Logo variant="horizontal" className="!justify-start !px-0 !py-0" />
        <h1 className="athena-h1 mt-4">Entrar</h1>
        <p className="athena-caption mt-2">ATHENA GYM Plataforma</p>
      </div>
      <Suspense fallback={<p className="athena-muted">Carregando…</p>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
