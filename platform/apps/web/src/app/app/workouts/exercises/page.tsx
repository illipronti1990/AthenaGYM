import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { ExercisesPanel } from '@/modules/workouts/components/ExercisesPanel';

export default async function ExercisesPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Link href="/app/workouts" className="movvo-link text-sm text-[var(--gold)]">
        ← Treinos
      </Link>
      <h1 className="movvo-title text-3xl">Exercícios</h1>
      <ExercisesPanel accessToken={accessToken} />
    </div>
  );
}
