import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { PartnersPanel } from '@/modules/operations/components/PartnersPanel';

export default async function PartnersPage() {
  const accessToken = await requireAccessToken();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="athena-title text-3xl">Parceiros</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Wellhub e TotalPass — aprovar logins externos na recepção
          </p>
        </div>
        <Link href="/app/operations" className="athena-link text-sm text-[var(--gold)]">
          ← Operações
        </Link>
      </div>
      <PartnersPanel accessToken={accessToken} />
    </div>
  );
}
