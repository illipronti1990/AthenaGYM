import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { CashflowPanel } from '@/modules/finance/components/FinancePanels';

export default async function FinanceCashflowPage() {
  const accessToken = await requireAccessToken();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="athena-title text-3xl">Fluxo de caixa</h1>
        <Link href="/app/finance" className="athena-link text-sm text-[var(--gold)]">
          ← Financeiro
        </Link>
      </div>
      <CashflowPanel accessToken={accessToken} />
    </div>
  );
}
