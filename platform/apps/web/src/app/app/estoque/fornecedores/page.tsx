import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { EstoqueNav } from '@/modules/inventory/components/EstoqueNav';
import { SuppliersPanel } from '@/modules/inventory/components/InventoryPanels';

export default async function EstoqueFornecedoresPage() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader title="Fornecedores" description="Cadastro de fornecedores da loja." />
      <PageFilters>
        <EstoqueNav />
      </PageFilters>
      <PageContent>
        <SuppliersPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
