import { Suspense } from 'react';
import { Logo } from '@movvo/ui';
import { AcceptInviteForm } from '@/modules/auth/AcceptInviteForm';

export default function AcceptInvitePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4">
      <div>
        <Logo variant="horizontal" className="!justify-start !px-0 !py-0" />
        <h1 className="movvo-h2 mt-4">Aceitar convite</h1>
        <p className="movvo-caption mt-2">Movvo Plataforma</p>
      </div>
      <Suspense fallback={<p className="movvo-muted text-sm">Carregando…</p>}>
        <AcceptInviteForm />
      </Suspense>
    </main>
  );
}
