import Link from 'next/link';
import { Page, PageHeader, PageContent, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { PartnerLogsPanel } from '@/modules/acesso/components/PartnerLogsPanel';

export default async function IntegracoesLogsPage() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader title="Logs de parceiros" description="Auditoria de API / webhooks com retry." />
      <p className="mb-4">
        <Link href="/app/integracoes" className="movvo-link text-sm text-[var(--gold)]">
          ← Integrações
        </Link>
      </p>
      <PageContent>
        <PartnerLogsPanel accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
