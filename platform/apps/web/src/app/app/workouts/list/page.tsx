import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { WorkoutsPanel } from '@/modules/workouts/components/WorkoutsPanel';

export default async function WorkoutsListPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Link href="/app/workouts" className="athena-link text-sm text-[var(--gold)]">
        ← Treinos
      </Link>
      <h1 className="athena-title text-3xl">Treinos</h1>
      <WorkoutsPanel accessToken={accessToken} />
    </div>
  );
}
