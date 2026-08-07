import dynamic from 'next/dynamic';
import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { EstoqueNav } from '@/modules/inventory/components/EstoqueNav';

const ProductsPanel = dynamic(
  () =>
    import('@/modules/inventory/components/InventoryPanels').then((m) => m.ProductsPanel),
  { loading: () => <p className="text-sm text-[var(--muted)]">Carregando produtos…</p> },
);

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
