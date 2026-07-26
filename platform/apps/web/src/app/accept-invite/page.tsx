import { Suspense } from 'react';
import { AcceptInviteForm } from '@/modules/auth/AcceptInviteForm';

export default function AcceptInvitePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-[#A3001B]">ATHENA PLATFORM</p>
        <h1 className="mt-2 text-3xl font-bold">Aceitar convite</h1>
      </div>
      <Suspense fallback={<p>Carregando…</p>}>
        <AcceptInviteForm />
      </Suspense>
    </main>
  );
}
