import { Suspense } from 'react';
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
        <p className="text-sm uppercase tracking-[0.28em] text-[var(--gold)]">ATHENA</p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--text)]">Entrar</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Plataforma premium para academias</p>
      </div>
      <Suspense fallback={<p className="text-[var(--muted)]">Carregando…</p>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
