import Link from 'next/link';
import { Button } from '@athena/ui';
import { requireAccessToken } from '@/lib/auth/token';
import { apiGetMe } from '@/services/api';
import { StudentForm } from '@/modules/students/components/StudentForm';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

export default async function NewStudentPage() {
  const accessToken = await requireAccessToken();

  const me = await apiGetMe(accessToken);
  const units = me.units.filter((u) => isUuid(u.id));
  const unitId =
    [me.auth.defaultUnitId, me.profile.defaultUnitId, ...me.auth.unitIds, units[0]?.id].find(
      isUuid,
    ) || '';

  if (!unitId && units.length === 0) {
    return (
      <p className="text-sm text-[var(--primary-hover)]">
        Nenhuma unidade vinculada. Configure membership/unit antes de cadastrar.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="athena-title text-3xl">Novo aluno</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Formulário inteligente com validação em tempo real e CEP automático
          </p>
        </div>
        <Link href="/app/students/enroll">
          <Button type="button" variant="secondary" size="sm">
            Matrícula rápida (wizard)
          </Button>
        </Link>
      </div>
      <StudentForm
        accessToken={accessToken}
        unitId={unitId || units[0]?.id || ''}
        units={units.map((u) => ({ id: u.id, name: u.name }))}
      />
    </div>
  );
}
