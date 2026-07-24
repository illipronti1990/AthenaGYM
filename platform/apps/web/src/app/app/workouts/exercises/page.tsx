import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { ExercisesPanel } from '@/modules/workouts/components/ExercisesPanel';

export default async function ExercisesPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Link href="/app/workouts" className="text-sm text-[#A3001B]">
        ← Treinos
      </Link>
      <h1 className="text-2xl font-bold">Exercícios</h1>
      <ExercisesPanel accessToken={accessToken} />
    </div>
  );
}
