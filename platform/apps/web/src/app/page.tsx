import Link from 'next/link';
import { Logo } from '@athena/ui';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6">
      <Logo variant="horizontal" className="!justify-start !px-0" />
      <h1 className="athena-h1">SaaS oficial para academias</h1>
      <p className="athena-body text-[var(--muted)]">
        Produto premium — Next.js + NestJS + Supabase.
      </p>
      <div className="flex gap-3">
        <Link href="/login" className="athena-btn athena-btn-primary">
          Login
        </Link>
        <Link href="/app" className="athena-btn athena-btn-secondary">
          App
        </Link>
      </div>
    </main>
  );
}
