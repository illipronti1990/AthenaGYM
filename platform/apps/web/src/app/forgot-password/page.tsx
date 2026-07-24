import { ForgotPasswordForm } from '@/modules/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-[#A3001B]">ATHENAS PLATFORM</p>
        <h1 className="mt-2 text-3xl font-bold">Recuperar senha</h1>
      </div>
      <ForgotPasswordForm />
    </main>
  );
}
