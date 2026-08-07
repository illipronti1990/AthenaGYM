import Link from 'next/link';
import { Page, PageHeader, PageContent } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { PayablesPanel } from '@/modules/finance/components/FinancePanels';

export default async function FinanceiroPagarPage() {
  const accessToken = await requireAccessToken();

  return (
    <Page>
      <PageHeader
        title="Contas a pagar"
        description="Despesas, fornecedores e categorias."
        actions={
          <Link href="/app/financeiro" className="athena-link text-sm text-[var(--gold)]">
            ← Financeiro
          </Link>
        }
      />
      <PageContent>
        <PayablesPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
