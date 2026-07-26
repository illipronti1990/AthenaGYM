import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { ClassesPanel } from '@/modules/operations/components/ClassesPanel';

export default async function AulasPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Link href="/app/operations" className="athena-link text-sm text-[var(--gold)]">
        ← Operações
      </Link>
      <h1 className="athena-title text-3xl">Aulas</h1>
      <ClassesPanel accessToken={accessToken} />
    </div>
  );
}
