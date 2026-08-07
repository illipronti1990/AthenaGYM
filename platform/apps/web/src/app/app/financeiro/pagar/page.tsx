import Link from 'next/link';
import { Page, PageHeader, PageContent } from '@movvo/ui';
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
          <Link href="/app/financeiro" className="movvo-link text-sm text-[var(--gold)]">
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
