import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { AssessmentsPanel } from '@/modules/workouts/components/AssessmentsPanel';

export default async function AssessmentsPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Link href="/app/workouts" className="text-sm text-[#A3001B]">
        ← Treinos
      </Link>
      <h1 className="text-2xl font-bold">Avaliações físicas</h1>
      <AssessmentsPanel accessToken={accessToken} />
    </div>
  );
}
