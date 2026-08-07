import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { CommercialLeadsPanel } from '@/modules/commercial/CommercialLeadsPanel';

export default async function CommercialPage() {
  const token = await requireAccessToken();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="athena-title text-3xl">CRM comercial Movvo</h1>
        <div className="flex gap-3 text-sm">
          <Link href="/app/commercial/analytics" className="athena-link text-[var(--gold)]">Analytics</Link>
          <Link href="/app/commercial/onboarding" className="athena-link text-[var(--gold)]">Onboarding</Link>
          <Link href="/app/commercial/templates" className="athena-link text-[var(--gold)]">Templates</Link>
        </div>
      </div>
      <p className="text-sm text-[var(--muted)]">
        Leads de demonstração da landing — separado do CRM de academias clientes.
      </p>
      <CommercialLeadsPanel accessToken={token} />
    </div>
  );
}
