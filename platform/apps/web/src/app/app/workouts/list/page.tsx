import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { WorkoutsPanel } from '@/modules/workouts/components/WorkoutsPanel';

export default async function WorkoutsListPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Link href="/app/workouts" className="text-sm text-[#A3001B]">
        ← Treinos
      </Link>
      <h1 className="text-2xl font-bold">Treinos</h1>
      <WorkoutsPanel accessToken={accessToken} />
    </div>
  );
}
