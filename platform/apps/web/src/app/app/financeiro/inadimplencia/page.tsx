import Link from 'next/link';
import { Page, PageHeader, PageContent } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { DelinquencyPanel } from '@/modules/finance/components/DelinquencyPanel';

export default async function FinanceiroInadimplenciaPage() {
  const accessToken = await requireAccessToken();

  return (
    <Page>
      <PageHeader
        title="Inadimplência"
        description="Alunos em atraso com contato rápido via WhatsApp e e-mail."
        actions={
          <Link href="/app/financeiro" className="movvo-link text-sm text-[var(--gold)]">
            ← Financeiro
          </Link>
        }
      />
      <PageContent>
        <DelinquencyPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
