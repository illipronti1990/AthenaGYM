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
          <h1 className="text-2xl font-bold">Treinos & Performance</h1>
          <p className="text-sm text-zinc-600">Prescrição, avaliações e evolução física</p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded border border-zinc-300 px-3 py-1.5 text-zinc-700 hover:border-[#A3001B] hover:text-[#A3001B]"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <WorkoutsDashboardPanel accessToken={accessToken} />
    </div>
  );
}
