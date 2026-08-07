import Link from 'next/link';
import { Page, PageHeader, PageContent, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { CheckinPanel } from '@/modules/operations/components/CheckinPanel';

export default async function AcessoCheckinPage() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader
        title="Check-in"
        description="Manual, CPF, código, QR — com motivo claro em caso de bloqueio."
      />
      <p className="mb-4">
        <Link href="/app/acesso" className="movvo-link text-sm text-[var(--gold)]">
          ← Acesso
        </Link>
      </p>
      <PageContent>
        <CheckinPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
