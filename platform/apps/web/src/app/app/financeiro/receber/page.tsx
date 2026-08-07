import Link from 'next/link';
import { Page, PageHeader, PageContent } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { ReceivablesPanel } from '@/modules/finance/components/ReceivablesPanel';

export default async function FinanceiroReceberPage() {
  const accessToken = await requireAccessToken();

  return (
    <Page>
      <PageHeader
        title="Contas a receber"
        description="Cobranças, recebimentos e status de pagamento."
        actions={
          <Link href="/app/financeiro" className="athena-link text-sm text-[var(--gold)]">
            ← Financeiro
          </Link>
        }
      />
      <PageContent>
        <ReceivablesPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
