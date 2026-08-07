import { Page, PageHeader, PageContent, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { BiNav } from '@/modules/bi/components/BiNav';
import { ChurnBiClient } from '@/modules/bi/components/ChurnBiClient';

export default async function PageBiChurn() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader title="IA de cancelamento" description="Score de churn e ações sugeridas." />
      <BiNav current="/app/bi/churn" />
      <PageContent>
        <ChurnBiClient accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
