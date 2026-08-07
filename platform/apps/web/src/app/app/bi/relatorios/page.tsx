import { Page, PageHeader, PageContent, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { BiNav } from '@/modules/bi/components/BiNav';
import { ReportsBiPanel } from '@/modules/bi/components/BiPanels';

export default async function PageBiRelatorios() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader title="Relatórios e exportação" description="CSV dos seus alunos (professor) ou exportações gerenciais." />
      <BiNav current="/app/bi/relatorios" />
      <PageContent>
        <ReportsBiPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
