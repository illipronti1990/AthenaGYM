import { STUDENT_STATUS_LABELS, type StudentStatus } from '@athena/shared';

const tones: Record<string, string> = {
  lead: 'bg-[rgba(212,175,55,0.15)] text-[var(--gold)]',
  pre_registration: 'bg-[rgba(244,211,94,0.12)] text-[var(--gold-light)]',
  active: 'bg-[rgba(160,0,24,0.2)] text-[#ff6b7a]',
  delinquent: 'bg-[rgba(230,57,70,0.18)] text-[#E63946]',
  blocked: 'bg-[rgba(160,0,24,0.35)] text-white',
  cancelled: 'bg-[var(--surface)] text-[var(--muted)]',
  archived: 'bg-[var(--surface)] text-[var(--muted)]',
};

export function StudentStatusBadge({ status }: { status: string }) {
  const label = STUDENT_STATUS_LABELS[status as StudentStatus] || status;
  return (
    <span
      className={`inline-flex rounded-[10px] px-2 py-0.5 text-xs font-medium ${tones[status] || 'bg-[var(--surface)] text-[var(--muted)]'}`}
      data-testid="student-status"
    >
      {label}
    </span>
  );
}

export { StudentStatusBadge as StudentStatus };
export { StudentStatusBadge as StudentBadge };
