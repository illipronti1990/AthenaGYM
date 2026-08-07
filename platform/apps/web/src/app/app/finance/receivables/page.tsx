import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { ReceivablesPanel } from '@/modules/finance/components/ReceivablesPanel';

export default async function FinanceReceivablesPage() {
  const accessToken = await requireAccessToken();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="movvo-title text-3xl">Contas a receber</h1>
        <Link href="/app/finance" className="movvo-link text-sm text-[var(--gold)]">
          ← Financeiro
        </Link>
      </div>
      <ReceivablesPanel accessToken={accessToken} />
    </div>
  );
}
