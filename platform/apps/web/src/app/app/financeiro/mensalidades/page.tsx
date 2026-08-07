import Link from 'next/link';
import { Page, PageHeader, PageContent } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { SubscriptionsPanel } from '@/modules/finance/components/FinancePanels';

export default async function FinanceiroMensalidadesPage() {
  const accessToken = await requireAccessToken();

  return (
    <Page>
      <PageHeader
        title="Mensalidades"
        description="Assinaturas e renovação de cobranças vencidas."
        actions={
          <Link href="/app/financeiro" className="movvo-link text-sm text-[var(--gold)]">
            ← Financeiro
          </Link>
        }
      />
      <PageContent>
        <SubscriptionsPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
