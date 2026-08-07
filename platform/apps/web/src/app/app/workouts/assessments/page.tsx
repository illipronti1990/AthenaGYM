import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { AssessmentsPanel } from '@/modules/workouts/components/AssessmentsPanel';

export default async function AssessmentsPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Link href="/app/workouts" className="movvo-link text-sm text-[var(--gold)]">
        ← Treinos
      </Link>
      <h1 className="movvo-title text-3xl">Avaliações físicas</h1>
      <AssessmentsPanel accessToken={accessToken} />
    </div>
  );
}
