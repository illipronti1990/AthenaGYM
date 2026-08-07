import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { EstoqueNav } from '@/modules/inventory/components/EstoqueNav';
import { InventoryCountWizard } from '@/modules/inventory/components/InventoryPanels';

export default async function EstoqueInventarioPage() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader
        title="Inventário físico"
        description="Contagem e ajustes auditados de estoque."
      />
      <PageFilters>
        <EstoqueNav />
      </PageFilters>
      <PageContent>
        <InventoryCountWizard accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
