import Link from 'next/link';
import type { StudentListItem } from '@athena/shared';
import { formatCpf } from '@athena/shared';
import { StudentAvatar } from './StudentAvatar';
import { StudentStatusBadge } from './StudentStatus';

export function StudentCard({ student }: { student: StudentListItem }) {
  return (
    <Link
      href={`/app/students/${student.id}`}
      className="flex items-center gap-3 border-b border-[var(--border)] px-3 py-3 transition hover:bg-[var(--surface)] last:border-b-0"
      data-testid="student-card"
    >
      <StudentAvatar name={student.fullName} photoUrl={student.photoUrl} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-[var(--text)]">{student.fullName}</p>
        <p className="truncate text-xs text-[var(--muted)]">
          {formatCpf(student.cpf) || student.registrationNumber}
          {student.planName ? ` · ${student.planName}` : ''}
        </p>
      </div>
      <StudentStatusBadge status={student.status} />
    </Link>
  );
}
