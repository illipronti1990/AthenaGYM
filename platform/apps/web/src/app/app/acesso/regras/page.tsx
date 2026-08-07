import Link from 'next/link';
import { Page, PageHeader, PageContent, pageQualityAttrs } from '@movvo/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { AccessRulesForm } from '@/modules/acesso/components/AccessRulesForm';

export default async function AcessoRegrasPage() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader title="Regras de acesso" description="Limites diários, horário, inadimplência e plano." />
      <p className="mb-4">
        <Link href="/app/acesso" className="movvo-link text-sm text-[var(--gold)]">
          ← Acesso
        </Link>
      </p>
      <PageContent>
        <AccessRulesForm accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
