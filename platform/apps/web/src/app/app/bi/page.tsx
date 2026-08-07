import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Page, PageHeader, PageContent, PageFilters, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { BI_LINKS } from '@/modules/bi/utils/biLinks';

const ExecutiveBiPanel = dynamic(
  () =>
    import('@/modules/bi/components/BiPanels').then((m) => m.ExecutiveBiPanel),
  { loading: () => <p className="text-sm text-[var(--muted)]">Carregando executivo…</p> },
);
const InsightsBiPanel = dynamic(
  () =>
    import('@/modules/bi/components/BiPanels').then((m) => m.InsightsBiPanel),
  { loading: () => <p className="text-sm text-[var(--muted)]">Carregando insights…</p> },
);

export default async function BiHubPage() {
  const accessToken = await requireAccessToken();

  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader
        title="Business Intelligence"
        description="Dashboards, KPIs, previsões, insights e Movvo AI para decisão."
      />
      <PageFilters>
        {BI_LINKS.filter(([, href]) => href !== '/app/bi').map(([label, href]) => (
          <Link key={href} href={href} className="movvo-chip-nav">
            {label}
          </Link>
        ))}
      </PageFilters>
      <PageContent className="space-y-8">
        <ExecutiveBiPanel accessToken={accessToken} />
        <InsightsBiPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
