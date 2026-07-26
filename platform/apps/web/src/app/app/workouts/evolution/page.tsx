import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { EvolutionPanel } from '@/modules/workouts/components/AssessmentsPanel';

export default async function EvolutionPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Link href="/app/workouts" className="athena-link text-sm text-[var(--gold)]">
        ← Treinos
      </Link>
      <h1 className="athena-title text-3xl">Evolução</h1>
      <EvolutionPanel accessToken={accessToken} />
    </div>
  );
}
