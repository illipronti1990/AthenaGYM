import Link from 'next/link';
import { Page, PageHeader, PageContent } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { SettingsPanel } from '@/modules/finance/components/FinancePanels';

export default async function FinanceiroConfiguracoesPage() {
  const accessToken = await requireAccessToken();

  return (
    <Page>
      <PageHeader
        title="Configurações financeiras"
        description="Contas bancárias, PIX e centros de custo."
        actions={
          <Link href="/app/financeiro" className="athena-link text-sm text-[var(--gold)]">
            ← Financeiro
          </Link>
        }
      />
      <PageContent>
        <SettingsPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
