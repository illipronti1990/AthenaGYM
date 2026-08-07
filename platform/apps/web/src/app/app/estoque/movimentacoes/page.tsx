import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { EstoqueNav } from '@/modules/inventory/components/EstoqueNav';
import { StockMovementsPanel } from '@/modules/inventory/components/InventoryPanels';

export default async function EstoqueMovimentacoesPage() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader
        title="Movimentações"
        description="Entradas, saídas, ajustes, perdas e consumo interno."
      />
      <PageFilters>
        <EstoqueNav />
      </PageFilters>
      <PageContent>
        <StockMovementsPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
