import { Badge, type BadgeTone } from '@movvo/ui';
import {
  STUDENT_STATUS_LABELS,
  STUDENT_DISPLAY_STATUS_LABELS,
  type StudentDisplayStatus,
  type StudentStatus,
} from '@movvo/shared';

const dbTones: Record<string, BadgeTone> = {
  lead: 'novo',
  pre_registration: 'novo',
  active: 'ativo',
  delinquent: 'inadimplente',
  blocked: 'inadimplente',
  cancelled: 'cancelado',
  archived: 'cancelado',
};

const displayTones: Record<StudentDisplayStatus, BadgeTone> = {
  active: 'ativo',
  pending: 'novo',
  expiring: 'gold',
  delinquent: 'inadimplente',
  cancelled: 'cancelado',
  trial: 'novo',
};

export function AlunoStatusBadge({
  status,
  displayStatus,
}: {
  status: string;
  displayStatus?: string | null;
}) {
  const ds = displayStatus as StudentDisplayStatus | undefined;
  if (ds && STUDENT_DISPLAY_STATUS_LABELS[ds]) {
    return (
      <Badge tone={displayTones[ds] || 'cancelado'} data-testid="student-status">
        {STUDENT_DISPLAY_STATUS_LABELS[ds]}
      </Badge>
    );
  }
  const label = STUDENT_STATUS_LABELS[status as StudentStatus] || status;
  return (
    <Badge tone={dbTones[status] || 'cancelado'} data-testid="student-status">
      {label}
    </Badge>
  );
}

export { AlunoStatusBadge as AlunoStatus };
export { AlunoStatusBadge as AlunoBadge };
