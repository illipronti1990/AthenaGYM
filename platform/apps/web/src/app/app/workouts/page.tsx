import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { WorkoutsDashboardPanel } from '@/modules/workouts/components/WorkoutsDashboardPanel';

const links = [
  ['Treinos', '/app/workouts/list'],
  ['Exercícios', '/app/workouts/exercises'],
  ['Avaliações', '/app/workouts/assessments'],
  ['Evolução', '/app/workouts/evolution'],
] as const;

export default async function WorkoutsHubPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="movvo-title text-3xl">Treinos & Performance</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Prescrição, avaliações e evolução física
          </p>
        </div>
        <nav className="flex flex-wrap gap-2">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="movvo-chip-nav">
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <WorkoutsDashboardPanel accessToken={accessToken} />
    </div>
  );
}
