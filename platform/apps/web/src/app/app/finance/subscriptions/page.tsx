import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { SubscriptionsPanel } from '@/modules/finance/components/FinancePanels';

export default async function FinanceSubscriptionsPage() {
  const accessToken = await requireAccessToken();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Assinaturas</h1>
        <Link href="/app/finance" className="text-sm text-[#A3001B] hover:underline">
          ← Financeiro
        </Link>
      </div>
      <SubscriptionsPanel accessToken={accessToken} />
    </div>
  );
}
