import { STUDENT_STATUS_LABELS, type StudentStatus } from '@athenas/shared';

const tones: Record<string, string> = {
  lead: 'bg-sky-100 text-sky-800',
  pre_registration: 'bg-amber-100 text-amber-900',
  active: 'bg-emerald-100 text-emerald-800',
  delinquent: 'bg-orange-100 text-orange-900',
  blocked: 'bg-red-100 text-red-800',
  cancelled: 'bg-zinc-200 text-zinc-700',
  archived: 'bg-zinc-100 text-zinc-500',
};

export function StudentStatusBadge({ status }: { status: string }) {
  const label =
    STUDENT_STATUS_LABELS[status as StudentStatus] || status;
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${tones[status] || 'bg-zinc-100 text-zinc-700'}`}
      data-testid="student-status"
    >
      {label}
    </span>
  );
}

export { StudentStatusBadge as StudentStatus };
export { StudentStatusBadge as StudentBadge };
