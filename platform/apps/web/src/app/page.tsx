import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6">
      <p className="text-sm uppercase tracking-widest text-[#A3001B]">ATHENA PLATFORM</p>
      <h1 className="text-4xl font-bold text-zinc-900">SaaS oficial — Sprint 0</h1>
      <p className="text-zinc-600">
        Next.js + NestJS + Supabase. Excel/FastAPI permanecem como sync legado.
      </p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded bg-[#A3001B] px-4 py-2 font-semibold text-white"
        >
          Login
        </Link>
        <Link
          href="/app"
          className="rounded border border-zinc-300 px-4 py-2 text-zinc-800"
        >
          App
        </Link>
      </div>
    </main>
  );
}
