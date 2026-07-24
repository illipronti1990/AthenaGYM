import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { EvolutionPanel } from '@/modules/workouts/components/AssessmentsPanel';

export default async function EvolutionPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Link href="/app/workouts" className="text-sm text-[#A3001B]">
        ← Treinos
      </Link>
      <h1 className="text-2xl font-bold">Evolução</h1>
      <EvolutionPanel accessToken={accessToken} />
    </div>
  );
}
