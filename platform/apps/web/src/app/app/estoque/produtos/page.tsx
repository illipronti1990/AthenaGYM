import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { EstoqueNav } from '@/modules/inventory/components/EstoqueNav';
import { ProductsPanel } from '@/modules/inventory/components/InventoryPanels';

export default async function EstoqueProdutosPage() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader title="Produtos" description="Cadastro com SKU, preços, estoque e foto." />
      <PageFilters>
        <EstoqueNav />
      </PageFilters>
      <PageContent>
        <ProductsPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
