import Link from 'next/link';
import { Page, PageHeader, PageContent } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { CashRegister } from '@/modules/finance/components/CashRegister';

export default async function FinanceiroCaixaPage() {
  const accessToken = await requireAccessToken();

  return (
    <Page>
      <PageHeader
        title="Caixa"
        description="Abertura, sangria, suprimento e fechamento do caixa."
        actions={
          <Link href="/app/financeiro" className="athena-link text-sm text-[var(--gold)]">
            ← Financeiro
          </Link>
        }
      />
      <PageContent>
        <CashRegister accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
