import { requireAccessToken } from '@/lib/auth/token';
import Link from 'next/link';
import { ClassesPanel } from '@/modules/operations/components/ClassesPanel';

export default async function AulasPage() {
  const accessToken = await requireAccessToken();
  return (
    <div className="space-y-4">
      <Link href="/app/operations" className="text-sm text-[#A3001B]">
        ← Operações
      </Link>
      <h1 className="text-2xl font-bold">Aulas</h1>
      <ClassesPanel accessToken={accessToken} />
    </div>
  );
}
