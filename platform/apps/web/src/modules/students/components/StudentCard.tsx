import Link from 'next/link';
import type { StudentListItem } from '@athenas/shared';
import { formatCpf } from '@athenas/shared';
import { StudentAvatar } from './StudentAvatar';
import { StudentStatusBadge } from './StudentStatus';

export function StudentCard({ student }: { student: StudentListItem }) {
  return (
    <Link
      href={`/app/students/${student.id}`}
      className="flex items-center gap-3 border-b border-zinc-100 px-3 py-3 hover:bg-zinc-50"
      data-testid="student-card"
    >
      <StudentAvatar name={student.fullName} photoUrl={student.photoUrl} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-zinc-900">{student.fullName}</p>
        <p className="truncate text-xs text-zinc-500">
          {formatCpf(student.cpf) || student.registrationNumber}
          {student.planName ? ` · ${student.planName}` : ''}
        </p>
      </div>
      <StudentStatusBadge status={student.status} />
    </Link>
  );
}
