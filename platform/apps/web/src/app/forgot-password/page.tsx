import { Logo } from '@athena/ui';
import { ForgotPasswordForm } from '@/modules/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4">
      <div>
        <Logo variant="horizontal" className="!justify-start !px-0 !py-0" />
        <h1 className="athena-h2 mt-4">Recuperar senha</h1>
        <p className="athena-caption mt-2">ATHENA GYM Plataforma</p>
      </div>
      <ForgotPasswordForm />
    </main>
  );
}
