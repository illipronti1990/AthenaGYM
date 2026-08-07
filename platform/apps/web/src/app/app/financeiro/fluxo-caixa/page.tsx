import Link from 'next/link';
import { Page, PageHeader, PageContent } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { CashFlowSummary } from '@/modules/finance/components/CashFlowSummary';
import { CashflowPanel } from '@/modules/finance/components/FinancePanels';

export default async function FinanceiroFluxoCaixaPage() {
  const accessToken = await requireAccessToken();

  return (
    <Page>
      <PageHeader
        title="Fluxo de caixa"
        description="Resumo por período e lançamentos diários."
        actions={
          <Link href="/app/financeiro" className="athena-link text-sm text-[var(--gold)]">
            ← Financeiro
          </Link>
        }
      />
      <PageContent>
        <div className="space-y-6">
          <CashFlowSummary accessToken={accessToken} />
          <CashflowPanel accessToken={accessToken} />
        </div>
      </PageContent>
    </Page>
  );
}
