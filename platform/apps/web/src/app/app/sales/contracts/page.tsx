import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { ContractsPanel } from '@/modules/sales/components/ContractsPanel';

export default async function SalesContractsPage() {
  const accessToken = await requireAccessToken();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="athena-title text-3xl">Contratos</h1>
        <Link href="/app/sales" className="athena-link text-sm text-[var(--gold)]">
          ← Comercial
        </Link>
      </div>
      <ContractsPanel accessToken={accessToken} />
    </div>
  );
}
