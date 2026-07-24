import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { AgendaPanel } from '@/modules/operations/components/AgendaPanel';

export default async function AgendaPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Link href="/app/operations" className="text-sm text-[#A3001B]">
        ← Operações
      </Link>
      <h1 className="text-2xl font-bold">Agenda</h1>
      <AgendaPanel accessToken={accessToken} />
    </div>
  );
}
