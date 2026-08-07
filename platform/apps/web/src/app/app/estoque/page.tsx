import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { EstoqueNav } from '@/modules/inventory/components/EstoqueNav';
import { InventoryDashboardPanel } from '@/modules/inventory/components/InventoryPanels';

export default async function EstoqueHubPage() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader
        title="Estoque / Loja"
        description="Produtos, PDV, compras, inventário e alertas da loja."
      />
      <PageFilters>
        <EstoqueNav />
      </PageFilters>
      <PageContent>
        <InventoryDashboardPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
