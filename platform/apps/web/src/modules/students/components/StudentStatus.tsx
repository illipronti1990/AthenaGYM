import { Badge, type BadgeTone } from '@athena/ui';
import { STUDENT_STATUS_LABELS, type StudentStatus } from '@athena/shared';

const tones: Record<string, BadgeTone> = {
  lead: 'novo',
  pre_registration: 'novo',
  active: 'ativo',
  delinquent: 'inadimplente',
  blocked: 'inadimplente',
  cancelled: 'cancelado',
  archived: 'cancelado',
};

export function StudentStatusBadge({ status }: { status: string }) {
  const label = STUDENT_STATUS_LABELS[status as StudentStatus] || status;
  return (
    <Badge tone={tones[status] || 'cancelado'} data-testid="student-status">
      {label}
    </Badge>
  );
}

export { StudentStatusBadge as StudentStatus };
export { StudentStatusBadge as StudentBadge };
