import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { EstoqueNav } from '@/modules/inventory/components/EstoqueNav';
import { InventoryReportsPanel } from '@/modules/inventory/components/InventoryPanels';

export default async function EstoqueRelatoriosPage() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader title="Relatórios da loja" description="Exportações CSV básicas." />
      <PageFilters>
        <EstoqueNav />
      </PageFilters>
      <PageContent>
        <InventoryReportsPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
