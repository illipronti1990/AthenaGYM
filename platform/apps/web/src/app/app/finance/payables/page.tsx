import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { PayablesPanel } from '@/modules/finance/components/FinancePanels';

export default async function FinancePayablesPage() {
  const accessToken = await requireAccessToken();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="athena-title text-3xl">Contas a pagar</h1>
        <Link href="/app/finance" className="athena-link text-sm text-[var(--gold)]">
          ← Financeiro
        </Link>
      </div>
      <PayablesPanel accessToken={accessToken} />
    </div>
  );
}
