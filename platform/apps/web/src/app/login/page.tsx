import { Suspense } from 'react';
import { LoginForm } from '@/modules/auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-[#A3001B]">ATHENAS PLATFORM</p>
        <h1 className="mt-2 text-3xl font-bold">Entrar</h1>
      </div>
      <Suspense fallback={<p>Carregando…</p>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
