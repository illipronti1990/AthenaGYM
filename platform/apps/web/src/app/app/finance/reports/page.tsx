import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { DrePanel } from '@/modules/finance/components/FinancePanels';

export default async function FinanceReportsPage() {
  const accessToken = await requireAccessToken();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">DRE</h1>
        <Link href="/app/finance" className="text-sm text-[#A3001B] hover:underline">
          ← Financeiro
        </Link>
      </div>
      <DrePanel accessToken={accessToken} />
    </div>
  );
}
