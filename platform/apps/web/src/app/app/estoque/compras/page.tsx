import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { EstoqueNav } from '@/modules/inventory/components/EstoqueNav';
import { PurchaseOrdersPanel } from '@/modules/inventory/components/InventoryPanels';

export default async function EstoqueComprasPage() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader
        title="Compras"
        description="Pedidos e recebimento com entrada de estoque e payable."
      />
      <PageFilters>
        <EstoqueNav />
      </PageFilters>
      <PageContent>
        <PurchaseOrdersPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
