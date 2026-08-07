import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { EstoqueNav } from '@/modules/inventory/components/EstoqueNav';
import { StockAlertsPanel } from '@/modules/inventory/components/InventoryPanels';

export default async function EstoqueAlertasPage() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader
        title="Alertas de estoque"
        description="Mínimo, ruptura e produtos sem movimentação."
      />
      <PageFilters>
        <EstoqueNav />
      </PageFilters>
      <PageContent>
        <StockAlertsPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
