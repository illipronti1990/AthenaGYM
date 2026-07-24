import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { AccessPanel } from '@/modules/operations/components/AccessPanel';

export default async function AcessoPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Link href="/app/operations" className="text-sm text-[#A3001B]">
        ← Operações
      </Link>
      <h1 className="text-2xl font-bold">Acesso / catracas</h1>
      <AccessPanel accessToken={accessToken} />
    </div>
  );
}
