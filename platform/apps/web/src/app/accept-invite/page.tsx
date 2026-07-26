import { Suspense } from 'react';
import { Logo } from '@athena/ui';
import { AcceptInviteForm } from '@/modules/auth/AcceptInviteForm';

export default function AcceptInvitePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4">
      <div>
        <Logo variant="horizontal" className="!justify-start !px-0 !py-0" />
        <h1 className="athena-h2 mt-4">Aceitar convite</h1>
        <p className="athena-caption mt-2">ATHENA GYM Plataforma</p>
      </div>
      <Suspense fallback={<p className="athena-muted text-sm">Carregando…</p>}>
        <AcceptInviteForm />
      </Suspense>
    </main>
  );
}
