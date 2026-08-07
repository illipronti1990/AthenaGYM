import { Page, PageHeader, PageContent, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { BiNav } from '@/modules/bi/components/BiNav';
import { CompareClient } from '@/modules/bi/components/CompareClient';

export default async function PageBiComparativos() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader title="Comparativos" description="Período atual vs anterior." />
      <BiNav current="/app/bi/comparativos" />
      <PageContent>
        <CompareClient accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
