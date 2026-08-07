import Link from 'next/link';
import { Page, PageHeader, PageContent } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { ReconciliationPanel } from '@/modules/finance/components/FinancePanels';

export default async function FinanceiroConciliacaoPage() {
  const accessToken = await requireAccessToken();

  return (
    <Page>
      <PageHeader
        title="Conciliação bancária"
        description="Importação de extratos CSV/OFX e matching."
        actions={
          <Link href="/app/financeiro" className="movvo-link text-sm text-[var(--gold)]">
            ← Financeiro
          </Link>
        }
      />
      <PageContent>
        <ReconciliationPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
