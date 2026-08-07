import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { CommercialOnboardingPanel } from '@/modules/commercial/CommercialOnboardingPanel';

export default async function CommercialOnboardingPage() {
  const token = await requireAccessToken();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="movvo-title text-3xl">Onboarding comercial</h1>
        <Link href="/app/commercial" className="movvo-link text-sm text-[var(--gold)]">← CRM</Link>
      </div>
      <p className="text-sm text-[var(--muted)]">
        Checklist: Cadastro → Contrato → Configuração → Importação → Treinamento → Go-live.
      </p>
      <CommercialOnboardingPanel accessToken={token} />
    </div>
  );
}
