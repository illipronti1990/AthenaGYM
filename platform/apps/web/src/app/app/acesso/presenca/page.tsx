import Link from 'next/link';
import { Page, PageHeader, PageContent, pageQualityAttrs } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { PresenceBoard } from '@/modules/acesso/components/PresenceBoard';

export default async function AcessoPresencaPage() {
  const accessToken = await requireAccessToken();
  return (
    <Page {...pageQualityAttrs()}>
      <PageHeader title="Presença" description="Quem está dentro agora, tempo médio e pico do dia." />
      <p className="mb-4">
        <Link href="/app/acesso" className="athena-link text-sm text-[var(--gold)]">
          ← Acesso
        </Link>
      </p>
      <PageContent>
        <PresenceBoard accessToken={accessToken} />
      </PageContent>
    </Page>
  );
}
