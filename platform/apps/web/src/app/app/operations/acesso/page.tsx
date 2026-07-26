import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { AccessPanel } from '@/modules/operations/components/AccessPanel';

export default async function AcessoPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Link href="/app/operations" className="athena-link text-sm text-[var(--gold)]">
        ← Operações
      </Link>
      <h1 className="athena-title text-3xl">Acesso / catracas</h1>
      <AccessPanel accessToken={accessToken} />
    </div>
  );
}
