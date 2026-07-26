import { requireAccessToken } from '@/lib/auth/token';
import { TrainersPanel } from '@/modules/trainers/TrainersPanel';

export default async function TrainersPage() {
  const accessToken = await requireAccessToken();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="athena-title text-3xl">Professores</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Cadastro da equipe de treino e personal
        </p>
      </div>
      <TrainersPanel accessToken={accessToken} />
    </div>
  );
}
