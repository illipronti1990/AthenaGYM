import { Page, PageHeader, PageContent, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { BiNav } from '@/modules/bi/components/BiNav';
import { BenchmarkClient } from '@/modules/bi/components/BenchmarkClient';

export default async function PageBiBenchmark() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader title="Benchmark interno" description="Compare modalidades, professores e planos." />
      <BiNav current="/app/bi/benchmark" />
      <PageContent>
        <BenchmarkClient accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
