import Link from 'next/link';
import { Page, PageHeader, PageContent, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { LiveAccessMonitor } from '@/modules/acesso/components/LiveAccessMonitor';
import { AccessPanel } from '@/modules/operations/components/AccessPanel';

export default async function AcessoMonitorPage() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader title="Monitor" description="Feed ao vivo de liberações e negações (poll 4s)." />
      <p className="mb-4">
        <Link href="/app/acesso" className="athena-link text-sm text-[var(--gold)]">
          ← Acesso
        </Link>
      </p>
      <PageContent className="space-y-8">
        <LiveAccessMonitor accessToken={accessToken} />
        <AccessPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
