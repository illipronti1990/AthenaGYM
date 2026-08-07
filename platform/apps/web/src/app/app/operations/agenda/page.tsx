import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { AgendaPanel } from '@/modules/operations/components/AgendaPanel';

export default async function AgendaPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Link href="/app/operations" className="movvo-link text-sm text-[var(--gold)]">
        ← Operações
      </Link>
      <h1 className="movvo-title text-3xl">Agenda</h1>
      <AgendaPanel accessToken={accessToken} />
    </div>
  );
}
