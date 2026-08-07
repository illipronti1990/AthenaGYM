import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { EstoqueNav } from '@/modules/inventory/components/EstoqueNav';
import { PdvWorkstation } from '@/modules/inventory/components/InventoryPanels';

export default async function EstoquePdvPage() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader title="PDV" description="Venda no balcão com baixa de estoque e financeiro." />
      <PageFilters>
        <EstoqueNav />
      </PageFilters>
      <PageContent>
        <PdvWorkstation accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
