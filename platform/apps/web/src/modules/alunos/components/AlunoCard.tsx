import Link from 'next/link';
import type { StudentListItem } from '@movvo/shared';
import { formatCpf } from '@movvo/shared';
import { AlunoAvatar } from './AlunoAvatar';
import { AlunoStatusBadge } from './AlunoStatus';

export function AlunoCard({ student }: { student: StudentListItem }) {
  return (
    <Link
      href={`/app/alunos/${student.id}`}
      className="flex items-center gap-3 border-b border-[var(--border)] px-3 py-3 transition hover:bg-[var(--surface)] last:border-b-0"
      data-testid="student-card"
    >
      <AlunoAvatar name={student.fullName} photoUrl={student.photoUrl} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-[var(--text)]">{student.fullName}</p>
        <p className="truncate text-xs text-[var(--muted)]">
          {formatCpf(student.cpf) || student.registrationNumber}
          {student.planName ? ` · ${student.planName}` : ''}
        </p>
      </div>
      <AlunoStatusBadge status={student.status} />
    </Link>
  );
}
