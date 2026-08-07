import Link from 'next/link';
import { Page, PageHeader, PageContent } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { DrePanel } from '@/modules/finance/components/FinancePanels';

export default async function FinanceiroRelatoriosPage() {
  const accessToken = await requireAccessToken();

  return (
    <Page>
      <PageHeader
        title="Relatórios financeiros"
        description="DRE e indicadores do período."
        actions={
          <Link href="/app/financeiro" className="athena-link text-sm text-[var(--gold)]">
            ← Financeiro
          </Link>
        }
      />
      <PageContent>
        <DrePanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
