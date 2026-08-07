import Link from 'next/link';
import { Page, PageHeader, PageContent, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { AccessAgendaTimeline } from '@/modules/acesso/components/AccessAgendaTimeline';

export default async function AcessoAgendaPage() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader
        title="Agenda de acessos"
        description="Timeline do dia com origem próprio / Wellhub / TotalPass."
      />
      <p className="mb-4">
        <Link href="/app/acesso" className="movvo-link text-sm text-[var(--gold)]">
          ← Acesso
        </Link>
      </p>
      <PageContent>
        <AccessAgendaTimeline accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
